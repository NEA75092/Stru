"""STRUCTURA PRO v2 - Decrement Score Engine.

Run standalone:
    streamlit run decrement_score.py

Integrate in STRUCTURA:
    from decrement_score import DecrementScoreUI
    DecrementScoreUI().render()
"""

from __future__ import annotations

import io
import json
import math
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import quote

import numpy as np
import pandas as pd

try:  # Optional UI dependency.
    import plotly.graph_objects as go
except ImportError:  # pragma: no cover
    go = None

try:  # Optional PDF dependency.
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.graphics.shapes import Drawing, Line, Polygon, PolyLine, Rect, String
    from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except ImportError:  # pragma: no cover
    colors = None
    A4 = None
    Drawing = None
    getSampleStyleSheet = None
    cm = None
    Line = None
    PageBreak = None
    Paragraph = None
    Polygon = None
    PolyLine = None
    Rect = None
    SimpleDocTemplate = None
    Spacer = None
    String = None
    Table = None
    TableStyle = None

try:  # Optional app dependency.
    import streamlit as st
except ImportError:  # pragma: no cover
    st = None

try:  # Optional data dependency.
    import yfinance as yf
except ImportError:  # pragma: no cover
    yf = None


CALENDAR_DAYS_PER_YEAR = 365
TRADING_DAYS_PER_YEAR = 252
MIN_HISTORY_YEARS = 3.0
RECALL_MIN_HISTORY_YEARS = 15.0

THEME = {
    "bg": "#0d1b2a",
    "panel": "#151b35",
    "panel_2": "#1a2040",
    "hover": "rgba(201,168,76,0.08)",
    "border": "rgba(255,255,255,0.07)",
    "text": "#ffffff",
    "text_2": "rgba(255,255,255,0.8)",
    "text_3": "rgba(255,255,255,0.5)",
    "gold": "#c9a84c",
    "blue": "#4f8ef7",
    "green": "#4ade80",
    "red": "#f87171",
    "orange": "#f97316",
}

WEIGHTS = {
    "Coverage Ratio": 0.20,
    "Performance Drag": 0.20,
    "Stress Test": 0.15,
    "Recall Efficiency": 0.12,
    "Dividend Stability": 0.08,
    "Trend Survival": 0.05,
    "Capital Loss Severity": 0.10,
    "Path Dependency": 0.05,
    "Dividend Trend": 0.05,
}

GRADE_ORDER = {"E": 1, "D": 2, "C": 3, "B": 4, "A": 5}
SOURCE_LABELS = {
    "cache_fresh": ("cache", THEME["green"]),
    "yfinance": ("live", THEME["blue"]),
    "cache_stale": ("cache expiré ⚠", THEME["orange"]),
    "csv_upload": ("csv", THEME["gold"]),
    "hardcoded": ("estimé", THEME["text_3"]),
    "unavailable": ("indisponible", THEME["red"]),
    "inconnu": ("inconnu", THEME["text_3"]),
}


@dataclass(frozen=True, init=False)
class UnderlyingConfig:
    name: str
    asset_type: str
    region: str
    pr_ticker: str | None = None
    tr_ticker: str | None = None
    decrement_type: str = "points"
    decrement_value: float | None = None
    decrement_currency: str = "pts"
    fallback_dividend_yield: float = 2.0
    basket_components: list[str] = field(default_factory=list)
    basket_weights: list[float] = field(default_factory=list)

    def __init__(
        self,
        name: str,
        asset_type: str,
        region: str,
        pr_ticker: str | None = None,
        tr_ticker: str | None = None,
        decrement_type: str = "points",
        decrement_value: float | None = None,
        decrement_currency: str = "pts",
        fallback_dividend_yield: float = 2.0,
        basket_components: list[str] | None = None,
        basket_weights: list[float] | None = None,
        *,
        decrement_points: float | None = None,
        decrement_pct: float | None = None,
        decrement_eur: float | None = None,
    ) -> None:
        legacy_value = {"points": decrement_points, "pct": decrement_pct, "eur": decrement_eur}.get(decrement_type)
        final_value = decrement_value if decrement_value is not None else legacy_value
        final_currency = decrement_currency
        if decrement_type == "pct" and final_currency == "pts":
            final_currency = "%"
        if decrement_type == "eur" and final_currency == "pts":
            final_currency = "EUR"
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "asset_type", asset_type)
        object.__setattr__(self, "region", region)
        object.__setattr__(self, "pr_ticker", pr_ticker)
        object.__setattr__(self, "tr_ticker", tr_ticker)
        object.__setattr__(self, "decrement_type", decrement_type)
        object.__setattr__(self, "decrement_value", final_value)
        object.__setattr__(self, "decrement_currency", final_currency)
        object.__setattr__(self, "fallback_dividend_yield", fallback_dividend_yield)
        object.__setattr__(self, "basket_components", list(basket_components or []))
        object.__setattr__(self, "basket_weights", list(basket_weights or []))


DEFAULT_UNIVERSE = [
    UnderlyingConfig("Euro Stoxx 50 Dec 30", "Indice", "Europe", "^STOXX50E", "^SX5T", "points", 30.0, "pts", 3.2),
    UnderlyingConfig("Euro Stoxx 50 Dec 50", "Indice", "Europe", "^STOXX50E", "^SX5T", "points", 50.0, "pts", 3.2),
    UnderlyingConfig("Euro Stoxx 50 Dec 80", "Indice", "Europe", "^STOXX50E", "^SX5T", "points", 80.0, "pts", 3.2),
    UnderlyingConfig("CAC 40 Dec 50", "Indice", "Europe", "^FCHI", "^FCHT", "points", 50.0, "pts", 3.4),
    UnderlyingConfig("CAC 40 Dec 100", "Indice", "Europe", "^FCHI", "^FCHT", "points", 100.0, "pts", 3.4),
    UnderlyingConfig("DAX 40 Dec 50", "Indice", "Europe", "^GDAXI", "^GDAXTR", "points", 50.0, "pts", 2.8),
    UnderlyingConfig("Nasdaq-100 Dec 50", "Indice", "USA", "^NDX", "^NDXT", "points", 50.0, "pts", 0.5),
    UnderlyingConfig("S&P 500 Dec 50", "Indice", "USA", "^GSPC", None, "points", 50.0, "pts", 1.3),
    UnderlyingConfig("STOXX 600 Dec 30", "Indice", "Europe", "^STOXX", "^STOXXTR", "points", 30.0, "pts", 3.1),
    UnderlyingConfig("Euro Stoxx Banks Dec20", "Indice", "Europe", "SX7E.PA", None, "points", 20.0, "pts", 5.8),
    UnderlyingConfig("TotalEnergies Dec", "Action", "Europe", "TTE.PA", None, "eur", 2.10, "EUR", 5.0),
    UnderlyingConfig("BNP Paribas Dec", "Action", "Europe", "BNP.PA", None, "eur", 3.90, "EUR", 6.0),
    UnderlyingConfig("Siemens Dec", "Action", "Europe", "SIE.DE", None, "eur", 5.20, "EUR", 3.2),
]


class DataUnavailableError(Exception):
    """Levée quand aucune source ne peut fournir les données demandées."""


class DataProvider:
    """
    Responsabilité unique : fournir des pd.Series depuis les sources disponibles.
    Le moteur de score ne dépend jamais de cette classe.
    """

    CACHE_DIR = Path("./cache_decrement")
    CACHE_EXPIRY_HOURS = 24

    def __init__(self, force_refresh: bool = False):
        self.force_refresh = force_refresh
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._source_log: dict[str, str] = {}
        self._source_meta: dict[str, dict[str, Any]] = {}

    def get_series(self, ticker: str, period: str = "max") -> pd.Series:
        if not self.force_refresh:
            fresh = self._read_cache(ticker, period, fresh_only=True)
            if fresh is not None:
                self._record_source(ticker, "cache_fresh", fresh)
                return fresh

        try:
            series = self._fetch_yfinance(ticker, period)
            self._write_cache(ticker, period, series)
            self._record_source(ticker, "yfinance", series)
            return series
        except Exception:
            stale = self._read_cache(ticker, period, fresh_only=False)
            if stale is not None:
                self._record_source(ticker, "cache_stale", stale)
                return stale

            uploaded = self._read_uploaded(ticker)
            if uploaded is not None:
                self._record_source(ticker, "csv_upload", uploaded)
                return uploaded

            hardcoded = self._hardcoded_series(ticker)
            if hardcoded is not None:
                self._record_source(ticker, "hardcoded", hardcoded)
                return hardcoded

        self._source_log[ticker] = "unavailable"
        raise DataUnavailableError(
            f"Aucune donnée disponible pour {ticker}: cache absent, yfinance indisponible, aucun CSV uploadé."
        )

    def get_source(self, ticker: str) -> str:
        return self._source_log.get(ticker, "inconnu")

    def get_all_sources(self) -> dict[str, str]:
        return dict(self._source_log)

    def load_csv_upload(self, ticker: str, file) -> pd.Series:
        if st is None:
            raise DataUnavailableError("Streamlit est requis pour stocker un CSV uploadé.")
        frame = pd.read_csv(file)
        normalized = {str(col).strip().lower(): col for col in frame.columns}
        date_col = normalized.get("date")
        close_col = normalized.get("close")
        if date_col is None or close_col is None:
            raise ValueError("Format CSV invalide: colonnes attendues Date,Close.")
        series = pd.Series(frame[close_col].astype(float).values, index=pd.to_datetime(frame[date_col]), name=ticker)
        series.index = series.index.tz_localize(None) if getattr(series.index, "tz", None) is not None else series.index
        series = series.replace([np.inf, -np.inf], np.nan).dropna().sort_index()
        if len(series) < 2:
            raise ValueError("CSV trop court: au moins deux lignes Date,Close sont nécessaires.")
        st.session_state.setdefault("uploaded_data", {})[ticker] = series
        self._record_source(ticker, "csv_upload", series)
        return series

    def _read_cache(self, ticker: str, period: str, fresh_only: bool = False) -> pd.Series | None:
        path = self._cache_path(ticker, period)
        if not path.exists():
            return None
        age = pd.Timestamp.now() - pd.Timestamp(path.stat().st_mtime, unit="s")
        if fresh_only and age > pd.Timedelta(hours=self.CACHE_EXPIRY_HOURS):
            return None
        try:
            frame = pd.read_parquet(path)
            series = frame["Close"].astype(float)
            series.index = pd.to_datetime(series.index)
            return self._clean_series(series, ticker)
        except Exception:
            return None

    def _write_cache(self, ticker: str, period: str, series: pd.Series) -> None:
        try:
            pd.DataFrame({"Close": self._clean_series(series, ticker)}).to_parquet(self._cache_path(ticker, period))
        except Exception:
            return

    def _fetch_yfinance(self, ticker: str, period: str) -> pd.Series:
        if yf is None:
            raise DataUnavailableError("yfinance non installé.")
        frame = yf.download(ticker, period=period, progress=False, auto_adjust=True, threads=False)
        if frame is None or frame.empty:
            raise DataUnavailableError(f"yfinance ne retourne aucune donnée pour {ticker}.")
        column = "Close" if "Close" in frame.columns else frame.columns[0]
        if isinstance(column, tuple):
            series = frame[column]
        else:
            series = frame[column]
        return self._clean_series(series, ticker)

    def _status_from_log(self, ticker: str | None) -> dict[str, Any]:
        if not ticker:
            return {"available": False, "source": "inconnu", "last_date": None, "years": 0.0}
        if ticker not in self._source_log:
            return {"available": False, "source": "non calculé", "last_date": None, "years": 0.0}
        meta = self._source_meta.get(ticker, {})
        return {
            "available": True,
            "source": self._source_log[ticker],
            "last_date": meta.get("last_date"),
            "years": float(meta.get("years", 0.0) or 0.0),
        }

    def get_data_status(self, config: UnderlyingConfig) -> dict:
        warnings: list[str] = []
        pr = self._status_from_log(config.pr_ticker)
        tr = self._status_from_log(config.tr_ticker)
        if not pr["available"]:
            warnings.append("PR indisponible.")
        if config.tr_ticker and not tr["available"]:
            warnings.append("TR indisponible: fallback dividende.")
        if not config.tr_ticker:
            warnings.append("TR non configuré: fallback dividende.")
        return {
            "pr_available": pr["available"],
            "tr_available": tr["available"],
            "pr_source": pr["source"],
            "tr_source": tr["source"],
            "pr_last_date": pr["last_date"],
            "pr_years": pr["years"],
            "warnings": warnings,
        }

    def get_global_status(self, universe: list[UnderlyingConfig]) -> dict:
        if not self._source_log:
            return {
                "total": len(universe),
                "ok": 0,
                "partial": 0,
                "unavailable": len(universe),
                "last_refresh": None,
                "not_computed": True,
            }
        statuses = [self.get_data_status(config) for config in universe]
        ok = sum(1 for item in statuses if item["pr_available"] and (item["tr_available"] or not item["warnings"]))
        partial = sum(1 for item in statuses if item["pr_available"] and item["warnings"])
        unavailable = sum(1 for item in statuses if not item["pr_available"])
        last_dates = [item["pr_last_date"] for item in statuses if item["pr_last_date"] is not None]
        return {
            "total": len(universe),
            "ok": ok,
            "partial": partial,
            "unavailable": unavailable,
            "last_refresh": max(last_dates) if last_dates else None,
            "not_computed": False,
        }

    def export_cache_zip(self) -> bytes:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(self.CACHE_DIR.glob("*.parquet")):
                try:
                    frame = pd.read_parquet(path)
                    archive.writestr(path.with_suffix(".csv").name, frame.to_csv())
                except Exception:
                    continue
        return buffer.getvalue()

    def _cache_path(self, ticker: str, period: str) -> Path:
        safe = ticker.replace("/", "_").replace("^", "IDX_").replace(".", "_").replace(":", "_")
        return self.CACHE_DIR / f"{safe}_{period}.parquet"

    def _read_uploaded(self, ticker: str) -> pd.Series | None:
        if st is None:
            return None
        uploaded = st.session_state.get("uploaded_data", {})
        series = uploaded.get(ticker)
        if series is None:
            return None
        return self._clean_series(series, ticker)

    def _hardcoded_series(self, ticker: str) -> pd.Series | None:
        config = next((item for item in DEFAULT_UNIVERSE if item.pr_ticker == ticker or item.tr_ticker == ticker), None)
        if config is None:
            return None
        dates = pd.date_range(pd.Timestamp.today().normalize() - pd.DateOffset(years=20), pd.Timestamp.today().normalize(), freq="B")
        if len(dates) < 2:
            return None
        seed = abs(hash(ticker)) % 997 / 997
        annual_drift = max(config.fallback_dividend_yield / 100 + 0.015 + seed * 0.01, 0.005)
        daily = (1 + annual_drift) ** (1 / TRADING_DAYS_PER_YEAR) - 1
        cycle = np.sin(np.linspace(0, 18 * np.pi, len(dates))) * 0.0015
        levels = 100 * np.cumprod(1 + daily + cycle)
        return pd.Series(levels, index=dates, name=ticker)

    def _record_source(self, ticker: str, source: str, series: pd.Series) -> None:
        self._source_log[ticker] = source
        self._source_meta[ticker] = {
            "last_date": series.index.max() if not series.empty else None,
            "years": DecrementScoreEngine.history_years(series.index),
            "rows": len(series),
        }

    @staticmethod
    def _clean_series(series: pd.Series, name: str) -> pd.Series:
        clean = pd.Series(series).astype(float).replace([np.inf, -np.inf], np.nan).dropna()
        clean.index = pd.to_datetime(clean.index)
        if getattr(clean.index, "tz", None) is not None:
            clean.index = clean.index.tz_localize(None)
        clean = clean[~clean.index.duplicated(keep="last")].sort_index()
        clean.name = name
        if len(clean) < 2:
            raise DataUnavailableError(f"Série insuffisante pour {name}.")
        return clean


def _series_to_json(series: pd.Series | None) -> str | None:
    if series is None:
        return None
    clean = pd.Series(series).dropna()
    if clean.empty:
        return None
    return clean.to_json(date_format="iso")


def _series_from_json(payload: str | None) -> pd.Series | None:
    if not payload:
        return None
    series = pd.read_json(io.StringIO(payload), typ="series")
    series.index = pd.to_datetime(series.index)
    if getattr(series.index, "tz", None) is not None:
        series.index = series.index.tz_localize(None)
    return series


def _score_result_to_payload(result: "ScoreResult") -> dict[str, Any]:
    return {
        "config": result.config.__dict__,
        "score": result.score,
        "grade": result.grade,
        "criteria_scores": result.criteria_scores,
        "summary": result.summary,
        "warnings": result.warnings,
        "data_sources": dict(result.data_sources),
        "price_return_json": _series_to_json(result.price_return),
        "synthetic_decrement_json": _series_to_json(result.synthetic_decrement),
        "dividend_yield_daily_json": _series_to_json(result.dividend_yield_daily),
        "decrement_base_used": result.decrement_base_used,
        "history_years": result.history_years,
        "snapshot_date": result.snapshot_date.isoformat(),
    }


def _score_result_from_payload(payload: dict[str, Any], config: UnderlyingConfig | None = None) -> "ScoreResult":
    cfg = config or UnderlyingConfig(**payload["config"])
    return ScoreResult(
        config=cfg,
        score=float(payload["score"]),
        grade=str(payload["grade"]),
        criteria_scores=dict(payload["criteria_scores"]),
        summary=dict(payload["summary"]),
        warnings=list(payload.get("warnings", [])),
        data_sources=dict(payload.get("data_sources", {})),
        price_return=_series_from_json(payload["price_return_json"]),
        synthetic_decrement=_series_from_json(payload["synthetic_decrement_json"]),
        dividend_yield_daily=_series_from_json(payload.get("dividend_yield_daily_json")),
        decrement_base_used=str(payload["decrement_base_used"]),
        history_years=float(payload["history_years"]),
        snapshot_date=pd.Timestamp(payload["snapshot_date"]),
    )


def _cached_score_underlying_impl(
    config_payload: dict[str, Any],
    pr_json: str,
    tr_json: str | None,
    div_json: str | None,
    sources_json: str,
) -> dict[str, Any]:
    config = UnderlyingConfig(**config_payload)
    pr = _series_from_json(pr_json)
    tr = _series_from_json(tr_json)
    dividend = _series_from_json(div_json)
    if pr is None:
        raise DataUnavailableError(f"PR indisponible pour {config.name}.")
    result = DecrementScoreEngine().score_underlying(config, pr, tr, dividend)
    payload = _score_result_to_payload(result)
    sources = json.loads(sources_json)
    if result.summary.get("fallback_dividend_used"):
        sources["Dividend"] = "hardcoded"
    payload["data_sources"] = sources
    return payload


if st is not None:

    @st.cache_data(ttl=3600)
    def cached_score_universe_state(universe_json: str, provider_status: str) -> str:
        return f"{universe_json}|{provider_status}"

    @st.cache_data(ttl=3600)
    def cached_score_underlying(
        config_payload: dict[str, Any],
        pr_json: str,
        tr_json: str | None,
        div_json: str | None,
        sources_json: str,
    ) -> dict[str, Any]:
        return _cached_score_underlying_impl(config_payload, pr_json, tr_json, div_json, sources_json)

else:

    def cached_score_universe_state(universe_json: str, provider_status: str) -> str:
        return f"{universe_json}|{provider_status}"

    def cached_score_underlying(
        config_payload: dict[str, Any],
        pr_json: str,
        tr_json: str | None,
        div_json: str | None,
        sources_json: str,
    ) -> dict[str, Any]:
        return _cached_score_underlying_impl(config_payload, pr_json, tr_json, div_json, sources_json)


class DecrementScoreEngine:
    """
    Reçoit des pd.Series. Ne sait pas d'où elles viennent.
    """

    def score_underlying(
        self,
        config: UnderlyingConfig,
        pr: pd.Series,
        tr: pd.Series | None,
        dividend_yield_daily: pd.Series | None,
    ) -> "ScoreResult":
        warnings: list[str] = []
        price_return = self.clean_input_series(pr, "PR")
        if self.history_years(price_return.index) < MIN_HISTORY_YEARS:
            raise DataUnavailableError(f"Historique < 3 ans pour {config.name}.")

        decrement_base_used = "TR" if tr is not None and not tr.dropna().empty else "PR_FALLBACK"
        if decrement_base_used == "TR":
            base = self.clean_input_series(tr, "TR")
            aligned_base = pd.concat([price_return.rename("PR"), base.rename("BASE")], axis=1).dropna()
            price_return = aligned_base["PR"]
            base = aligned_base["BASE"]
        else:
            warnings.append("TR indisponible ou non configuré: reconstruction sur PR.")
            base = price_return.copy()

        fallback_dividend_used = dividend_yield_daily is None or dividend_yield_daily.dropna().empty
        if dividend_yield_daily is None and tr is not None:
            try:
                dividend_yield_daily = self.compute_implied_dividend_yield(price_return, self.clean_input_series(tr, "TR"))
                fallback_dividend_used = False
            except Exception:
                dividend_yield_daily = None
        if fallback_dividend_used:
            warnings.append("Dividende estimé via fallback_dividend_yield.")

        dividend_mean = self.annual_dividend_mean(dividend_yield_daily, config.fallback_dividend_yield)
        decrement_equiv = self.decrement_equivalent(config, price_return, dividend_mean)
        synthetic = self.reconstruct_synthetic_decrement(base, decrement_equiv, config)
        aligned = pd.concat([price_return.rename("PR"), synthetic.rename("IL")], axis=1).dropna()
        price_return = aligned["PR"]
        synthetic = aligned["IL"]

        decrement_pct = float((self.decrement_daily_pct(config, price_return, decrement_equiv).mean()) * 100)
        coverage = dividend_mean / decrement_pct if decrement_pct > 0 else np.nan
        drag_metrics = self.compute_drag_metrics(price_return, synthetic)
        stress_value = self.compute_stress_test(price_return, synthetic, config.decrement_type)
        recall_metrics = self.compute_recall_efficiency(price_return, synthetic)
        capital_loss = self.compute_capital_loss_severity(price_return, synthetic, recall_metrics)
        path_dependency = self.compute_path_dependency(price_return, synthetic)
        dividend_stability = self.compute_dividend_stability(dividend_yield_daily, config.fallback_dividend_yield)
        dividend_trend = self.compute_dividend_trend(dividend_yield_daily, fallback_dividend_used)
        trend_survival = self.compute_trend_survival(synthetic)
        recall_neutralized = bool(recall_metrics["neutralized"])

        if recall_neutralized:
            warnings.append("Recall Efficiency et Capital Loss Severity neutralisés: historique inférieur à 15 ans.")
        if config.decrement_type == "eur" and config.decrement_currency != "EUR":
            warnings.append("Décrément EUR appliqué sur action dont la devise configurée n'est pas EUR.")

        criteria_scores = {
            "Coverage Ratio": self.score_coverage(coverage),
            "Performance Drag": self.score_drag(drag_metrics["drag_composite"]),
            "Stress Test": self.score_stress_test(stress_value),
            "Recall Efficiency": self.score_recall_efficiency(recall_metrics["recall_efficiency"]),
            "Dividend Stability": self.score_dividend_stability(dividend_stability),
            "Trend Survival": self.score_trend_survival(trend_survival),
            "Capital Loss Severity": self.score_capital_loss_severity(capital_loss["capital_loss_severity"]),
            "Path Dependency": self.score_path_dependency(path_dependency["lateral_drag_mean"]),
            "Dividend Trend": dividend_trend["score"],
        }
        score = self.weighted_score(criteria_scores, recall_neutralized, fallback_dividend_used)
        grade = self.grade_from_score(score)
        data_sources = {}
        summary = {
            "dividend_annual_mean": float(dividend_mean),
            "decrement_equivalent": float(decrement_equiv),
            "decrement_pct": float(decrement_pct),
            "coverage_ratio": float(coverage) if np.isfinite(coverage) else np.nan,
            "dividend_cushion": float(dividend_mean - decrement_pct),
            "drag_3y": drag_metrics.get("drag_3y", np.nan),
            "drag_5y": drag_metrics.get("drag_5y", np.nan),
            "drag_10y": drag_metrics.get("drag_10y", np.nan),
            "drag_10y_cumulative": drag_metrics.get("drag_10y_cumulative", np.nan),
            "drag_composite": drag_metrics["drag_composite"],
            "stress_test": stress_value,
            "recall_efficiency": recall_metrics["recall_efficiency"],
            "recall_rate_pr": recall_metrics["recall_rate_pr"],
            "recall_rate_dec": recall_metrics["recall_rate_dec"],
            "recall_neutralized": recall_neutralized,
            "dividend_stability": dividend_stability,
            "trend_survival": trend_survival,
            "fallback_dividend_used": fallback_dividend_used,
            "capital_loss_severity": capital_loss["capital_loss_severity"],
            "non_recalled_windows": capital_loss["non_recalled_windows"],
            "total_windows": capital_loss["total_windows"],
            "lateral_drag_mean": path_dependency["lateral_drag_mean"],
            "lateral_windows": path_dependency["lateral_windows"],
            "dividend_trend_slope": dividend_trend["slope"],
            "dividend_trend_r2": dividend_trend["r_squared"],
        }
        return ScoreResult(
            config=config,
            score=round(float(score), 2),
            grade=grade,
            criteria_scores=criteria_scores,
            summary=summary,
            warnings=warnings,
            data_sources=data_sources,
            price_return=price_return,
            synthetic_decrement=synthetic,
            dividend_yield_daily=dividend_yield_daily,
            decrement_base_used=decrement_base_used,
            history_years=self.history_years(price_return.index),
            snapshot_date=price_return.index.max(),
        )

    @staticmethod
    def clean_input_series(series: pd.Series, name: str) -> pd.Series:
        clean = pd.Series(series).astype(float).replace([np.inf, -np.inf], np.nan).dropna()
        clean.index = pd.to_datetime(clean.index)
        if getattr(clean.index, "tz", None) is not None:
            clean.index = clean.index.tz_localize(None)
        clean = clean[~clean.index.duplicated(keep="last")].sort_index()
        clean.name = name
        if len(clean) < 2:
            raise DataUnavailableError(f"Série {name} insuffisante.")
        return clean

    @staticmethod
    def compute_implied_dividend_yield(price_return: pd.Series, total_return: pd.Series) -> pd.Series:
        aligned = pd.concat([price_return.rename("PR"), total_return.rename("TR")], axis=1).dropna()
        if aligned.empty:
            raise ValueError("Séries PR/TR non alignées.")
        pr_return = aligned["PR"].pct_change()
        tr_return = aligned["TR"].pct_change()
        div_yield = ((1 + tr_return) / (1 + pr_return)) - 1
        div_yield = div_yield.replace([np.inf, -np.inf], np.nan).dropna().clip(lower=-0.02, upper=0.02)
        if div_yield.empty:
            raise ValueError("Dividend yield implicite vide.")
        return div_yield

    @staticmethod
    def annual_dividend_mean(dividend_yield_daily: pd.Series | None, fallback_yield: float) -> float:
        """Retourne le dividende annuel moyen implicite (%), ou le fallback configuré.

        Les rendements journaliers sont agrégés par année civile (resample YE, somme × 100).
        La dernière année incomplète peut légèrement sous-estimer la moyenne — acceptable.
        Si moins de 10 ans d'historique, toutes les années disponibles sont utilisées.
        """
        if dividend_yield_daily is None or dividend_yield_daily.empty:
            return float(fallback_yield)
        clean = dividend_yield_daily.replace([np.inf, -np.inf], np.nan).dropna()
        if clean.empty:
            return float(fallback_yield)
        if DecrementScoreEngine.history_years(clean.index) < 1:
            return float(clean.mean() * CALENDAR_DAYS_PER_YEAR * 100)
        annual = DecrementScoreEngine.annual_dividends(dividend_yield_daily)
        if annual.empty:
            return float(fallback_yield)
        recent = annual[annual.index >= annual.index.max() - pd.DateOffset(years=10)]
        base = recent if not recent.empty else annual
        return float(base.mean())

    @staticmethod
    def annual_dividends(dividend_yield_daily: pd.Series | None) -> pd.Series:
        """Somme annuelle des rendements dividendes journaliers, exprimée en %."""
        if dividend_yield_daily is None or dividend_yield_daily.empty:
            return pd.Series(dtype=float)
        clean = dividend_yield_daily.replace([np.inf, -np.inf], np.nan).dropna()
        if clean.empty:
            return pd.Series(dtype=float)
        return (clean.resample("YE").sum() * 100).dropna()

    @staticmethod
    def decrement_equivalent(config: UnderlyingConfig, price_return: pd.Series, dividend_mean: float) -> float:
        level = float(price_return.dropna().iloc[-1])
        if config.decrement_type == "pct" and config.decrement_value is not None:
            return float(level * config.decrement_value)
        if config.decrement_type in {"points", "eur"} and config.decrement_value is not None:
            return float(config.decrement_value)
        return float(level * max(dividend_mean, 0.01) / 100)

    @staticmethod
    def decrement_daily_pct(config: UnderlyingConfig, price_return: pd.Series, decrement_equiv: float) -> pd.Series:
        clean = price_return.dropna().astype(float)
        if config.decrement_type == "pct":
            value = config.decrement_value if config.decrement_value is not None else decrement_equiv / clean.iloc[-1]
            return pd.Series(float(value), index=clean.index)
        return (decrement_equiv / clean).replace([np.inf, -np.inf], np.nan).dropna()

    @staticmethod
    def reconstruct_synthetic_decrement(
        base_series: pd.Series,
        decrement_equivalent: float,
        config: UnderlyingConfig | None = None,
    ) -> pd.Series:
        base = base_series.dropna().sort_index().astype(float)
        if len(base) < 2:
            raise ValueError("Historique insuffisant pour reconstruction décrément.")
        decrement_type = config.decrement_type if config is not None else "points"
        decrement_value = config.decrement_value if config is not None and config.decrement_value is not None else decrement_equivalent
        values = [float(base.iloc[0])]
        for idx in range(1, len(base)):
            days = max(1, int((base.index[idx] - base.index[idx - 1]).days))
            ratio = float(base.iloc[idx] / base.iloc[idx - 1])
            if decrement_type == "pct":
                next_value = values[-1] * (ratio - float(decrement_value) * days / CALENDAR_DAYS_PER_YEAR)
            else:
                next_value = values[-1] * ratio - float(decrement_value) * days / CALENDAR_DAYS_PER_YEAR
            values.append(max(next_value, 0.01))
        return pd.Series(values, index=base.index, name="IL")

    @staticmethod
    def compute_drag_metrics(price_return: pd.Series, synthetic: pd.Series) -> dict[str, float]:
        aligned = pd.concat([price_return.rename("PR"), synthetic.rename("IL")], axis=1).dropna()
        windows = {10: 0.50, 5: 0.35, 3: 0.15}
        drags: dict[int, float] = {}
        cumulative: dict[int, float] = {}
        for years in windows:
            window = aligned[aligned.index >= aligned.index.max() - pd.DateOffset(years=years)]
            if DecrementScoreEngine.history_years(window.index) < years * 0.70:
                continue
            drag = DecrementScoreEngine.annualized_performance(window["PR"]) - DecrementScoreEngine.annualized_performance(window["IL"])
            cum = ((window["PR"].iloc[-1] / window["PR"].iloc[0]) - (window["IL"].iloc[-1] / window["IL"].iloc[0])) * 100
            drags[years] = max(0.0, float(drag))
            cumulative[years] = max(0.0, float(cum))
        if not drags:
            raise DataUnavailableError("Historique insuffisant pour calculer le Performance Drag.")
        total_weight = sum(windows[year] for year in drags)
        composite = sum(drags[year] * windows[year] for year in drags) / total_weight
        return {
            "drag_3y": drags.get(3, np.nan),
            "drag_5y": drags.get(5, np.nan),
            "drag_10y": drags.get(10, np.nan),
            "drag_10y_cumulative": cumulative.get(10, np.nan),
            "drag_composite": float(composite),
        }

    @staticmethod
    def annualized_performance(series: pd.Series) -> float:
        clean = series.dropna()
        if len(clean) < 2:
            return np.nan
        years = DecrementScoreEngine.history_years(clean.index)
        if years <= 0 or clean.iloc[0] <= 0:
            return np.nan
        return float(((clean.iloc[-1] / clean.iloc[0]) ** (1 / years) - 1) * 100)

    @staticmethod
    def compute_stress_test(price_return: pd.Series, synthetic: pd.Series, decrement_type: str) -> float:
        pr_episodes = DecrementScoreEngine.worst_drawdown_episodes(price_return, count=3, min_gap_days=180)
        if not pr_episodes:
            return 0.0
        aligned = pd.concat([price_return.rename("PR"), synthetic.rename("IL")], axis=1).dropna()
        amplification: list[float] = []
        for episode in pr_episodes:
            window = aligned.loc[episode["peak"] : episode["trough"]]
            if len(window) < 2:
                continue
            pr_dd = abs(window["PR"].iloc[-1] / window["PR"].iloc[0] - 1)
            il_dd = abs(window["IL"].iloc[-1] / window["IL"].iloc[0] - 1)
            amplification.append(max(0.0, il_dd - pr_dd) * 100)
        malus = {"pct": 1.0, "points": 1.15, "eur": 1.30}.get(decrement_type, 1.15)
        return float(np.mean(amplification) * malus) if amplification else 0.0

    @staticmethod
    def worst_drawdown_episodes(series: pd.Series, count: int = 3, min_gap_days: int = 180) -> list[dict[str, Any]]:
        clean = series.dropna().sort_index().astype(float)
        if clean.empty:
            return []
        drawdown = clean / clean.cummax() - 1
        candidates = drawdown.nsmallest(min(len(drawdown), count * 20))
        episodes: list[dict[str, Any]] = []
        for trough, value in candidates.items():
            if any(abs((trough - episode["trough"]).days) < min_gap_days for episode in episodes):
                continue
            peak_window = clean.loc[:trough]
            if peak_window.empty:
                continue
            peak = peak_window.idxmax()
            episodes.append({"peak": peak, "trough": trough, "drawdown": abs(float(value))})
            if len(episodes) >= count:
                break
        return episodes

    @staticmethod
    def compute_recall_efficiency(price_return: pd.Series, synthetic: pd.Series) -> dict[str, float | bool | list[dict[str, Any]]]:
        aligned = pd.concat([price_return.rename("PR"), synthetic.rename("IL")], axis=1).dropna()
        if aligned.empty or DecrementScoreEngine.history_years(aligned.index) < RECALL_MIN_HISTORY_YEARS:
            return {
                "recall_rate_pr": np.nan,
                "recall_rate_dec": np.nan,
                "recall_efficiency": np.nan,
                "neutralized": True,
                "windows": [],
            }
        starts = aligned.index[::21]
        starts = starts[starts <= aligned.index.max() - pd.DateOffset(years=10)]
        windows: list[dict[str, Any]] = []
        pr_hits = 0
        dec_hits = 0
        for start in starts:
            window = aligned.loc[start : start + pd.DateOffset(years=10)]
            if DecrementScoreEngine.history_years(window.index) < 9.5:
                continue
            pr_base = float(window["PR"].iloc[0])
            dec_base = float(window["IL"].iloc[0])
            pr_recalled = False
            dec_recalled = False
            for year in range(1, 11):
                obs_date = start + pd.DateOffset(years=year)
                idx = window.index.searchsorted(obs_date)
                if idx >= len(window):
                    break
                if not pr_recalled and window["PR"].iloc[idx] >= pr_base:
                    pr_recalled = True
                if not dec_recalled and window["IL"].iloc[idx] >= dec_base:
                    dec_recalled = True
                if pr_recalled and dec_recalled:
                    break
            pr_hits += int(pr_recalled)
            dec_hits += int(dec_recalled)
            windows.append(
                {
                    "start": start,
                    "end": window.index[-1],
                    "pr_recalled": pr_recalled,
                    "dec_recalled": dec_recalled,
                    "pr_initial": pr_base,
                    "pr_final": float(window["PR"].iloc[-1]),
                    "il_initial": dec_base,
                    "il_final": float(window["IL"].iloc[-1]),
                }
            )
        if not windows:
            return {
                "recall_rate_pr": np.nan,
                "recall_rate_dec": np.nan,
                "recall_efficiency": np.nan,
                "neutralized": True,
                "windows": [],
            }
        recall_rate_pr = pr_hits / len(windows)
        recall_rate_dec = dec_hits / len(windows)
        efficiency = recall_rate_dec / recall_rate_pr if recall_rate_pr > 0 else np.nan
        return {
            "recall_rate_pr": float(recall_rate_pr),
            "recall_rate_dec": float(recall_rate_dec),
            "recall_efficiency": float(efficiency) if np.isfinite(efficiency) else np.nan,
            "neutralized": not np.isfinite(efficiency),
            "windows": windows,
        }

    @staticmethod
    def compute_capital_loss_severity(price_return: pd.Series, synthetic: pd.Series, recall_metrics: dict[str, Any]) -> dict[str, float | int]:
        if recall_metrics.get("neutralized"):
            return {"capital_loss_severity": np.nan, "non_recalled_windows": 0, "total_windows": 0}
        windows = recall_metrics.get("windows", [])
        severities: list[float] = []
        for window in windows:
            if window["dec_recalled"]:
                continue
            pr_perf = window["pr_final"] / window["pr_initial"]
            il_perf = window["il_final"] / window["il_initial"]
            severities.append(max(0.0, float(pr_perf - il_perf)) * 100)
        if not severities:
            return {"capital_loss_severity": 0.0, "non_recalled_windows": 0, "total_windows": len(windows)}
        return {
            "capital_loss_severity": float(np.mean(severities)),
            "non_recalled_windows": len(severities),
            "total_windows": len(windows),
        }

    @staticmethod
    def compute_path_dependency(price_return: pd.Series, synthetic: pd.Series) -> dict[str, float | int]:
        aligned = pd.concat([price_return.rename("PR"), synthetic.rename("IL")], axis=1).dropna()
        if DecrementScoreEngine.history_years(aligned.index) < 3:
            return {"lateral_drag_mean": np.nan, "lateral_windows": 0}
        starts = aligned.index[::63]
        drags: list[float] = []
        for start in starts:
            window = aligned.loc[start : start + pd.DateOffset(years=3)]
            if DecrementScoreEngine.history_years(window.index) < 2.7:
                continue
            pr_start = window["PR"].iloc[0]
            pr_min = window["PR"].min() / pr_start - 1
            pr_max = window["PR"].max() / pr_start - 1
            if pr_min >= -0.15 and pr_max <= 0.15:
                pr_perf = window["PR"].iloc[-1] / window["PR"].iloc[0]
                il_perf = window["IL"].iloc[-1] / window["IL"].iloc[0]
                drags.append(max(0.0, float(pr_perf - il_perf)) * 100)
        if not drags:
            return {"lateral_drag_mean": np.nan, "lateral_windows": 0}
        return {"lateral_drag_mean": float(np.mean(drags)), "lateral_windows": len(drags)}

    @staticmethod
    def compute_dividend_stability(dividend_yield_daily: pd.Series | None, fallback_yield: float) -> float:
        annual = DecrementScoreEngine.annual_dividends(dividend_yield_daily)
        if annual.empty:
            return 0.65 if fallback_yield > 0 else 0.0
        recent = annual[annual.index >= annual.index.max() - pd.DateOffset(years=10)]
        annual = recent if len(recent) >= 3 else annual
        if len(annual) < 3:
            return 0.65
        mean = abs(float(annual.mean()))
        cv = float(annual.std() / mean) if mean > 0 else 1.0
        worst_drop = abs(float(min(annual.pct_change().min(), 0.0)))
        pct_years_below = float((annual < annual.mean() * 0.75).mean())
        penalty = min(1.0, cv * 0.45 + worst_drop * 0.35 + pct_years_below * 0.20)
        return max(0.0, min(1.0, 1 - penalty))

    @staticmethod
    def compute_dividend_trend(dividend_yield_daily: pd.Series | None, fallback_used: bool) -> dict[str, float]:
        if fallback_used:
            return {"score": 60.0, "slope": 0.0, "r_squared": 0.0}
        annual = DecrementScoreEngine.annual_dividends(dividend_yield_daily)
        annual = annual[annual.index >= annual.index.max() - pd.DateOffset(years=10)] if not annual.empty else annual
        if len(annual) < 4:
            return {"score": 60.0, "slope": 0.0, "r_squared": 0.0}
        y = annual.to_numpy(dtype=float)
        x = np.arange(len(y), dtype=float)
        slope, intercept = np.polyfit(x, y, 1)
        predicted = slope * x + intercept
        ss_res = float(np.sum((y - predicted) ** 2))
        ss_tot = float(np.sum((y - y.mean()) ** 2))
        r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0
        if r_squared < 0.3:
            score = 60.0
        elif slope > 0:
            score = 100.0
        elif slope > -0.1:
            score = 80.0
        elif slope > -0.2:
            score = 60.0
        elif slope > -0.3:
            score = 40.0
        elif slope > -0.5:
            score = 20.0
        else:
            score = 0.0
        return {"score": score, "slope": float(slope), "r_squared": float(r_squared)}

    @staticmethod
    def compute_trend_survival(synthetic: pd.Series) -> float:
        clean = synthetic.dropna()
        if DecrementScoreEngine.history_years(clean.index) < 10:
            base = clean.iloc[0] if not clean.empty else np.nan
            return float((clean > base).mean() * 100) if np.isfinite(base) else 0.0
        starts = clean.index[::21]
        survivals: list[float] = []
        for start in starts:
            window = clean.loc[start : start + pd.DateOffset(years=10)]
            if DecrementScoreEngine.history_years(window.index) < 9.5:
                continue
            survivals.append(float((window > window.iloc[0]).mean() * 100))
        return float(np.mean(survivals)) if survivals else 0.0

    @staticmethod
    def score_coverage(coverage: float) -> float:
        if not np.isfinite(coverage):
            return 0.0
        if coverage >= 1.00:
            return 100.0
        if coverage >= 0.75:
            return 75.0
        if coverage >= 0.50:
            return 50.0
        if coverage >= 0.25:
            return 25.0
        return 0.0

    @staticmethod
    def score_drag(drag: float) -> float:
        if drag < 1:
            return 100.0
        if drag < 2:
            return 75.0
        if drag < 3.5:
            return 50.0
        if drag < 5:
            return 25.0
        return 0.0

    @staticmethod
    def score_stress_test(value: float) -> float:
        if value < 1:
            return 100.0
        if value < 2:
            return 75.0
        if value < 4:
            return 50.0
        if value < 6:
            return 25.0
        return 0.0

    @staticmethod
    def score_recall_efficiency(efficiency: float) -> float:
        if not np.isfinite(efficiency):
            return np.nan
        if efficiency >= 0.95:
            return 100.0
        if efficiency >= 0.85:
            return 75.0
        if efficiency >= 0.70:
            return 50.0
        if efficiency >= 0.55:
            return 25.0
        return 0.0

    @staticmethod
    def score_dividend_stability(stability: float) -> float:
        if stability >= 0.85:
            return 100.0
        if stability >= 0.70:
            return 75.0
        if stability >= 0.50:
            return 50.0
        if stability >= 0.30:
            return 25.0
        return 0.0

    @staticmethod
    def score_trend_survival(survival: float) -> float:
        if survival >= 60:
            return 100.0
        if survival >= 50:
            return 75.0
        if survival >= 40:
            return 50.0
        if survival >= 30:
            return 25.0
        return 0.0

    @staticmethod
    def score_capital_loss_severity(severity: float) -> float:
        if not np.isfinite(severity):
            return np.nan
        if severity < 5:
            return 100.0
        if severity < 10:
            return 75.0
        if severity < 15:
            return 50.0
        if severity < 25:
            return 25.0
        return 0.0

    @staticmethod
    def score_path_dependency(lateral_drag: float) -> float:
        if not np.isfinite(lateral_drag):
            return 50.0
        if lateral_drag < 3:
            return 100.0
        if lateral_drag < 6:
            return 75.0
        if lateral_drag < 10:
            return 50.0
        if lateral_drag < 15:
            return 25.0
        return 0.0

    @staticmethod
    def weighted_score(criteria_scores: dict[str, float], recall_neutralized: bool, fallback_dividend_used: bool = False) -> float:
        weights = dict(WEIGHTS)
        if recall_neutralized:
            weights["Performance Drag"] += weights.pop("Recall Efficiency")
            weights["Performance Drag"] += weights.pop("Capital Loss Severity")
        if fallback_dividend_used:
            div_weight = weights.pop("Dividend Stability", 0.0)
            c1 = weights.get("Coverage Ratio", 0.0)
            c2 = weights.get("Performance Drag", 0.0)
            total = c1 + c2
            if total > 0:
                weights["Coverage Ratio"] = c1 + div_weight * c1 / total
                weights["Performance Drag"] = c2 + div_weight * c2 / total
        numerator = 0.0
        denominator = 0.0
        for name, weight in weights.items():
            value = criteria_scores.get(name, np.nan)
            if np.isfinite(value):
                numerator += float(value) * weight
                denominator += weight
        return float(numerator / denominator) if denominator > 0 else 0.0

    @staticmethod
    def grade_from_score(score: float) -> str:
        if score >= 80:
            return "A"
        if score >= 65:
            return "B"
        if score >= 50:
            return "C"
        if score >= 35:
            return "D"
        return "E"

    @staticmethod
    def history_years(index: pd.Index) -> float:
        if len(index) < 2:
            return 0.0
        return float((index.max() - index.min()).days / 365.25)


@dataclass
class ScoreResult:
    config: UnderlyingConfig
    score: float
    grade: str
    criteria_scores: dict[str, float]
    summary: dict[str, Any]
    warnings: list[str]
    data_sources: dict[str, str]
    price_return: pd.Series
    synthetic_decrement: pd.Series
    dividend_yield_daily: pd.Series | None
    decrement_base_used: str
    history_years: float
    snapshot_date: pd.Timestamp


class DecrementScoreReport:
    def generate_technical_pdf(self, result: ScoreResult) -> bytes:
        if SimpleDocTemplate is None:
            return self._build_pdf(
                title=f"Analyse technique Decrement Score - {result.config.name}",
                rows=self._technical_rows(result),
                verdict=self._technical_verdict(result),
            )
        buffer = io.BytesIO()
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.4 * cm, bottomMargin=1.4 * cm)
        elements = [
            Paragraph("STRUCTURA PRO v2", styles["Title"]),
            Paragraph(f"Analyse technique Decrement Score - {result.config.name}", styles["Heading1"]),
            Spacer(1, 0.25 * cm),
            self._grade_block(result),
            Spacer(1, 0.35 * cm),
            self._radar_drawing(result),
            Spacer(1, 0.35 * cm),
            self._styled_table(self._technical_rows(result), [6 * cm, 5 * cm, 4 * cm]),
            Spacer(1, 0.35 * cm),
            Paragraph(self._technical_verdict(result), styles["BodyText"]),
        ]
        doc.build(elements)
        return buffer.getvalue()

    def generate_client_pdf(self, result: ScoreResult, client_name: str, product_name: str, issuer: str) -> bytes:
        if SimpleDocTemplate is None:
            return self._client_pdf_text_fallback(result, client_name, product_name, issuer)

        buffer = io.BytesIO()
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5 * cm,
            leftMargin=1.5 * cm,
            topMargin=1.4 * cm,
            bottomMargin=1.4 * cm,
        )
        client = client_name or "le client"
        product = product_name or "Produit"
        issuer_name = issuer or "Émetteur"
        elements = [
            Paragraph("STRUCTURA PRO v2", styles["Title"]),
            Paragraph(f"Analyse du sous-jacent — {result.config.name}", styles["Heading1"]),
            Paragraph(f"{product} · {issuer_name}", styles["Heading2"]),
            Spacer(1, 0.35 * cm),
            self._grade_block(result),
            Spacer(1, 0.4 * cm),
            self._styled_table(self._client_rows(result), [6.2 * cm, 4.8 * cm, 5.0 * cm]),
            Spacer(1, 0.45 * cm),
            Paragraph(self._client_verdict(result, client, product, issuer_name), styles["BodyText"]),
            Spacer(1, 0.45 * cm),
            Paragraph(
                "Ce document est établi sur la base de données historiques publiques. Il ne constitue pas un conseil en investissement au sens de la directive MiFID II et ne préjuge pas des performances futures.",
                styles["Italic"],
            ),
            PageBreak(),
            Paragraph("Performance historique comparée", styles["Heading1"]),
            Spacer(1, 0.25 * cm),
            self._performance_drawing(result),
            Spacer(1, 0.35 * cm),
            Paragraph(
                f"Sur {result.history_years:.1f} ans, le décrément a généré une sous-performance cumulée estimée de {result.summary.get('drag_10y_cumulative', result.summary['drag_composite'] * 10):.0f}%.",
                styles["BodyText"],
            ),
        ]
        doc.build(elements)
        return buffer.getvalue()

    def generate_comparison_pdf(
        self,
        left: ScoreResult,
        right: ScoreResult,
        left_coupon: float,
        right_coupon: float,
    ) -> bytes:
        analysis = DecrementScoreUI.compare_results(left, right, left_coupon, right_coupon)
        rows = [
            ["Indicateur", "Sous-jacent A", "Sous-jacent B"],
            ["Nom", left.config.name, right.config.name],
            ["Score", f"{left.score:.0f}/100 · {left.grade}", f"{right.score:.0f}/100 · {right.grade}"],
            ["Coupon saisi", f"{left_coupon:.2f}%", f"{right_coupon:.2f}%"],
            ["Gain coupon brut", f"{analysis['delta_coupon']:+.2f}%/an", ""],
            ["Coût décrément net", f"{analysis['net_cost']:+.2f}%/an", ""],
            ["Drag différentiel", f"{analysis['delta_drag']:+.2f}%/an", ""],
            ["Avantage réel estimé", f"{analysis['advantage']:+.2f}%/an", analysis["verdict"]],
        ]
        if SimpleDocTemplate is None:
            return self._build_pdf("Comparatif client Decrement Score", rows=rows, verdict=analysis["verdict"], regulatory=True)
        buffer = io.BytesIO()
        styles = getSampleStyleSheet()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.4 * cm, bottomMargin=1.4 * cm)
        elements = [
            Paragraph("STRUCTURA PRO v2", styles["Title"]),
            Paragraph("PDF Comparatif Client", styles["Heading1"]),
            Spacer(1, 0.35 * cm),
            self._styled_table(rows, [5.5 * cm, 5.5 * cm, 5.5 * cm]),
            Spacer(1, 0.45 * cm),
            Paragraph(analysis["verdict"], styles["BodyText"]),
            Spacer(1, 0.45 * cm),
            Paragraph(
                "Coupon saisi manuellement — source : term sheet banque.",
                styles["Italic"],
            ),
            PageBreak(),
            Paragraph("Graphique comparatif", styles["Heading1"]),
            Spacer(1, 0.25 * cm),
            self._comparison_drawing(left, right),
            Spacer(1, 0.35 * cm),
            Paragraph(
                "Ce document est établi sur la base de données historiques publiques et ne constitue pas un conseil en investissement au sens de la directive MiFID II.",
                styles["Italic"],
            ),
        ]
        doc.build(elements)
        return buffer.getvalue()

    def _build_pdf(
        self,
        title: str,
        rows: list[list[str]],
        verdict: str,
        subtitle: str = "",
        regulatory: bool = False,
    ) -> bytes:
        if SimpleDocTemplate is None:
            text = "\n".join([title, subtitle, "", *[" | ".join(row) for row in rows], "", verdict])
            return text.encode("utf-8")
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.4 * cm, bottomMargin=1.4 * cm)
        styles = getSampleStyleSheet()
        elements = [Paragraph("STRUCTURA PRO v2", styles["Title"]), Paragraph(title, styles["Heading1"])]
        if subtitle:
            elements.append(Paragraph(subtitle, styles["Heading2"]))
        elements.append(Spacer(1, 0.4 * cm))
        elements.extend([self._styled_table(rows, [6 * cm, 6 * cm, 4 * cm]), Spacer(1, 0.5 * cm), Paragraph(verdict, styles["BodyText"])])
        if regulatory:
            elements.extend(
                [
                    Spacer(1, 0.5 * cm),
                    Paragraph(
                        "Ce document est établi sur la base de données historiques publiques. Il ne constitue pas un conseil en investissement au sens de la directive MiFID II et ne préjuge pas des performances futures.",
                        styles["Italic"],
                    ),
                ]
            )
        doc.build(elements)
        return buffer.getvalue()

    @staticmethod
    def _styled_table(rows: list[list[str]], widths: list[float]) -> Table:
        table = Table(rows, colWidths=widths)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#151b35")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f7f7")]),
                ]
            )
        )
        return table

    @staticmethod
    def _grade_block(result: ScoreResult) -> Table:
        rows = [[f"Note {result.grade}", f"Score {result.score:.0f}/100"]]
        table = Table(rows, colWidths=[8 * cm, 8 * cm], rowHeights=[1.3 * cm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#151b35")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#c9a84c")),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 24),
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#c9a84c")),
                ]
            )
        )
        return table

    @staticmethod
    def _performance_drawing(result: ScoreResult) -> Drawing:
        width, height = 470, 250
        drawing = Drawing(width, height)
        drawing.add(Rect(0, 0, width, height, fillColor=colors.HexColor("#151b35"), strokeColor=colors.HexColor("#151b35")))
        pr, il = DecrementScoreUI.normalize_pair(result.price_return, result.synthetic_decrement)
        aligned = pd.concat([pr.rename("PR"), il.rename("IL")], axis=1).dropna()
        if aligned.empty:
            drawing.add(String(170, 120, "Données indisponibles", fillColor=colors.white))
            return drawing
        aligned = aligned.tail(min(len(aligned), TRADING_DAYS_PER_YEAR * 10))
        min_y = float(aligned.min().min())
        max_y = float(aligned.max().max())
        span = max(max_y - min_y, 1.0)

        def xy(row_idx: int, value: float) -> tuple[float, float]:
            x = 35 + row_idx / max(len(aligned) - 1, 1) * (width - 65)
            y = 35 + (value - min_y) / span * (height - 70)
            return x, y

        pr_points: list[float] = []
        il_points: list[float] = []
        for idx, (_date, row) in enumerate(aligned.iterrows()):
            pr_points.extend(xy(idx, float(row["PR"])))
            il_points.extend(xy(idx, float(row["IL"])))
        drawing.add(Line(35, 35, width - 25, 35, strokeColor=colors.HexColor("#ffffff"), strokeWidth=0.4))
        if len(pr_points) >= 4 and len(il_points) >= 4:
            fill_points = pr_points + list(reversed([(il_points[i], il_points[i + 1]) for i in range(0, len(il_points), 2)]))
            flat_fill = []
            for point in fill_points:
                if isinstance(point, tuple):
                    flat_fill.extend(point)
                else:
                    flat_fill.append(point)
            drawing.add(Polygon(flat_fill, fillColor=colors.Color(0.97, 0.28, 0.28, alpha=0.18), strokeColor=None))
        drawing.add(PolyLine(pr_points, strokeColor=colors.HexColor("#4f8ef7"), strokeWidth=1.5))
        drawing.add(PolyLine(il_points, strokeColor=colors.HexColor("#c9a84c"), strokeWidth=1.5))
        drawing.add(String(38, height - 25, "PR standard", fillColor=colors.HexColor("#4f8ef7"), fontSize=8))
        drawing.add(String(125, height - 25, "IL décrémenté", fillColor=colors.HexColor("#c9a84c"), fontSize=8))
        return drawing

    @staticmethod
    def _radar_drawing(result: ScoreResult) -> Drawing:
        width, height = 360, 260
        drawing = Drawing(width, height)
        cx, cy = width / 2, height / 2
        radius = 92
        names = list(WEIGHTS)
        points: list[float] = []
        for idx, name in enumerate(names):
            angle = -math.pi / 2 + idx * 2 * math.pi / len(names)
            axis_x = cx + math.cos(angle) * radius
            axis_y = cy + math.sin(angle) * radius
            drawing.add(Line(cx, cy, axis_x, axis_y, strokeColor=colors.HexColor("#cccccc"), strokeWidth=0.35))
            label_x = cx + math.cos(angle) * (radius + 18)
            label_y = cy + math.sin(angle) * (radius + 18)
            drawing.add(String(label_x - 18, label_y, name[:14], fillColor=colors.HexColor("#333333"), fontSize=6))
            score = result.criteria_scores.get(name, 0.0)
            score = 0.0 if not np.isfinite(score) else float(score)
            r = radius * score / 100
            points.extend([cx + math.cos(angle) * r, cy + math.sin(angle) * r])
        points.extend(points[:2])
        drawing.add(Polygon(points, fillColor=colors.Color(0.79, 0.66, 0.30, alpha=0.25), strokeColor=colors.HexColor("#c9a84c")))
        drawing.add(String(130, height - 18, "Radar 9 critères", fillColor=colors.HexColor("#151b35"), fontSize=10))
        return drawing

    @staticmethod
    def _comparison_drawing(left: ScoreResult, right: ScoreResult) -> Drawing:
        width, height = 470, 250
        drawing = Drawing(width, height)
        drawing.add(Rect(0, 0, width, height, fillColor=colors.HexColor("#151b35"), strokeColor=colors.HexColor("#151b35")))
        left_pr, left_il = DecrementScoreUI.normalize_pair(left.price_return, left.synthetic_decrement)
        right_pr = right.price_return / right.price_return.iloc[0] * 100
        aligned = pd.concat([left_pr.rename("PR_A"), left_il.rename("IL_A"), right_pr.rename("PR_B")], axis=1).dropna()
        if aligned.empty:
            drawing.add(String(170, 120, "Données indisponibles", fillColor=colors.white))
            return drawing
        aligned = aligned.tail(min(len(aligned), TRADING_DAYS_PER_YEAR * 10))
        min_y = float(aligned.min().min())
        max_y = float(aligned.max().max())
        span = max(max_y - min_y, 1.0)

        def line_points(column: str) -> list[float]:
            points: list[float] = []
            for idx, value in enumerate(aligned[column]):
                x = 35 + idx / max(len(aligned) - 1, 1) * (width - 65)
                y = 35 + (float(value) - min_y) / span * (height - 70)
                points.extend([x, y])
            return points

        drawing.add(PolyLine(line_points("PR_A"), strokeColor=colors.HexColor("#4f8ef7"), strokeWidth=1.3))
        drawing.add(PolyLine(line_points("IL_A"), strokeColor=colors.HexColor("#c9a84c"), strokeWidth=1.3))
        drawing.add(PolyLine(line_points("PR_B"), strokeColor=colors.HexColor("#4ade80"), strokeWidth=1.3))
        drawing.add(String(38, height - 25, "Indice A standard", fillColor=colors.HexColor("#4f8ef7"), fontSize=8))
        drawing.add(String(145, height - 25, "Indice A décrémenté", fillColor=colors.HexColor("#c9a84c"), fontSize=8))
        drawing.add(String(270, height - 25, "Indice B standard", fillColor=colors.HexColor("#4ade80"), fontSize=8))
        return drawing

    @staticmethod
    def _client_pdf_text_fallback(result: ScoreResult, client_name: str, product_name: str, issuer: str) -> bytes:
        text = "\n".join(
            [
                "STRUCTURA PRO v2",
                f"Analyse du sous-jacent — {result.config.name}",
                f"{product_name or 'Produit'} · {issuer or 'Émetteur'}",
                f"Note {result.grade} · Score {result.score:.0f}/100",
                "",
                *[" | ".join(row) for row in DecrementScoreReport._client_rows(result)],
                "",
                DecrementScoreUI.client_text(result, client_name or "le client", product_name or "le produit", issuer or "l'émetteur"),
            ]
        )
        return text.encode("utf-8")

    @staticmethod
    def _technical_rows(result: ScoreResult) -> list[list[str]]:
        return [["Critère", "Score", "Poids"]] + [
            [name, DecrementScoreUI.format_optional(value, "/100"), f"{WEIGHTS.get(name, 0):.0%}"]
            for name, value in result.criteria_scores.items()
        ]

    @staticmethod
    def _client_rows(result: ScoreResult) -> list[list[str]]:
        s = result.summary
        return [
            ["Indicateur", "Valeur", "Lecture"],
            ["Dividende annuel historique", f"{s['dividend_annual_mean']:.1f}%", ""],
            ["Coût annuel du décrément", f"{s['decrement_pct']:.1f}%", ""],
            ["Couverture du décrément", f"{s['coverage_ratio']:.2f}x", ""],
            ["Impact sur la performance", f"-{s['drag_composite']:.1f}%/an", ""],
            ["Risque en cas de non-rappel", f"+{s['capital_loss_severity']:.1f}pts de perte", ""],
        ]

    @staticmethod
    def _technical_verdict(result: ScoreResult) -> str:
        return f"Score {result.score:.0f}/100, note {result.grade}. Base utilisée: {result.decrement_base_used}."

    @staticmethod
    def _client_verdict(result: ScoreResult, client: str, product: str, issuer: str) -> str:
        return DecrementScoreUI.client_text(result, client, product, issuer)


class DecrementScoreUI:
    def __init__(self, universe: list[UnderlyingConfig] | None = None) -> None:
        self.universe = universe or DEFAULT_UNIVERSE
        self.provider = DataProvider(force_refresh=bool(st.session_state.get("force_refresh_decrement", False)) if st else False)
        self.engine = DecrementScoreEngine()
        self.report = DecrementScoreReport()

    def render(self) -> None:
        if st is None:
            raise ImportError("streamlit est requis pour afficher DecrementScoreUI.")
        self.inject_css()
        st.markdown("<div class='dec-title'>Decrement Score Engine</div>", unsafe_allow_html=True)
        st.session_state.setdefault("selected_underlying", None)
        selected = self.get_query_param("selected_underlying")
        if selected:
            st.session_state["selected_underlying"] = selected
        if st.session_state["selected_underlying"]:
            self.render_detail(st.session_state["selected_underlying"])
        else:
            self.render_screener()

    def render_screener(self) -> None:
        filters = self.render_sidebar()
        results = self.score_universe()
        filtered = self.filter_results(results, filters)
        filtered.sort(key=lambda result: result.score, reverse=True)
        self.render_sidebar_metrics(results, filtered)
        self.render_ranking_table(filtered)

    def render_sidebar(self) -> dict[str, Any]:
        with st.sidebar.expander("Sources de données", expanded=False):
            self.render_sources_panel()
        st.sidebar.markdown("### Filtres")
        asset_types = st.sidebar.multiselect("Type d'actif", ["Indices", "Actions", "Baskets"], default=["Indices"])
        regions = st.sidebar.multiselect("Région", sorted({config.region for config in self.universe}), default=sorted({config.region for config in self.universe}))
        min_dividend = st.sidebar.slider("Dividende min (%/an)", 0.0, 8.0, 0.0, 0.25)
        max_decrement = st.sidebar.slider("Décrément max (%/an)", 0.0, 15.0, 15.0, 0.25)
        min_grade = st.sidebar.select_slider("Note minimum", options=["E", "D", "C", "B", "A"], value="E")
        return {
            "asset_types": asset_types,
            "regions": regions,
            "min_dividend": min_dividend,
            "max_decrement": max_decrement,
            "min_grade": min_grade,
        }

    def render_sources_panel(self) -> None:
        cache_files = list(self.provider.CACHE_DIR.glob("*.parquet"))
        latest = max((pd.Timestamp(path.stat().st_mtime, unit="s") for path in cache_files), default=None)
        yf_status = "disponible" if yf is not None else "non installé"
        uploaded = st.session_state.get("uploaded_data", {})
        st.markdown(f"✅ Cache local — {len(cache_files)} tickers disponibles" + (f", mis à jour le {latest:%d/%m/%Y %H:%M}" if latest else ""))
        st.markdown(f"{'✅' if yf is not None else '⚠️'} yfinance — {yf_status}")
        st.markdown(f"📁 CSV uploadé — {len(uploaded)} tickers chargés" if uploaded else "📁 CSV uploadé — aucun")
        global_status = self.provider.get_global_status(self.universe)
        if global_status.get("not_computed"):
            st.caption("Statut global disponible après le premier calcul du screener.")
        else:
            st.caption(
                f"{global_status['ok']} sous-jacents disponibles · {global_status['partial']} partiels · {global_status['unavailable']} indisponibles"
            )
        if st.button("🔄 Rafraîchir depuis yfinance"):
            st.session_state["force_refresh_decrement"] = True
            st.session_state.pop("score_results", None)
            st.session_state.pop("score_results_key", None)
            st.rerun()
        ticker = st.text_input("Ticker correspondant", placeholder="^STOXX50E")
        file = st.file_uploader("📁 Uploader des données CSV", type=["csv"], help="Format attendu: Date,Close\n2024-01-01,4500.0")
        if file is not None and ticker:
            try:
                self.provider.load_csv_upload(ticker, file)
                st.success(f"CSV chargé pour {ticker}.")
            except Exception as exc:
                st.error(str(exc))
        st.download_button("📥 Télécharger les données en cache", self.provider.export_cache_zip(), file_name="cache_decrement_csv.zip")
        for ticker_name, source in self.provider.get_all_sources().items():
            meta = self.provider._source_meta.get(ticker_name, {})
            last = meta.get("last_date")
            suffix = f" ({last:%d/%m/%Y})" if isinstance(last, pd.Timestamp) else ""
            st.caption(f"{ticker_name} → {source}{suffix}")

    def score_universe(self) -> list[ScoreResult]:
        cache_key = json.dumps(
            {
                "universe": [config.__dict__ for config in self.universe],
                "force": bool(st.session_state.get("force_refresh_decrement", False)),
                "uploaded": sorted(st.session_state.get("uploaded_data", {}).keys()),
            },
            sort_keys=True,
            default=str,
        )
        provider_status = json.dumps(
            {
                "sources": self.provider.get_all_sources(),
                "force": bool(st.session_state.get("force_refresh_decrement", False)),
                "uploaded": sorted(st.session_state.get("uploaded_data", {}).keys()),
            },
            sort_keys=True,
            default=str,
        )
        cached_key = cached_score_universe_state(cache_key, provider_status)
        if st.session_state.get("score_results_key") == cached_key and "score_results" in st.session_state:
            return st.session_state["score_results"]
        progress = st.progress(0.0)
        status = st.empty()
        results: list[ScoreResult] = []
        for idx, config in enumerate(self.universe):
            status.caption(f"Calcul en cours: {config.name}")
            try:
                result = self.score_config(config)
                results.append(result)
            except Exception as exc:
                st.warning(f"{config.name}: {exc}")
            progress.progress((idx + 1) / len(self.universe))
        status.empty()
        progress.empty()
        st.session_state["score_results_key"] = cached_key
        st.session_state["score_results"] = results
        st.session_state["force_refresh_decrement"] = False
        return results

    def score_config(self, config: UnderlyingConfig) -> ScoreResult:
        pr = self.get_config_pr(config)
        tr = self.provider.get_series(config.tr_ticker) if config.tr_ticker else None
        dividend = self.dividend_series(config, pr, tr)
        sources: dict[str, str] = {}
        if config.pr_ticker:
            sources["PR"] = self.provider.get_source(config.pr_ticker)
        if config.tr_ticker:
            sources["TR"] = self.provider.get_source(config.tr_ticker)
        payload = cached_score_underlying(
            config.__dict__,
            _series_to_json(pr),
            _series_to_json(tr),
            _series_to_json(dividend),
            json.dumps(sources, sort_keys=True),
        )
        result = _score_result_from_payload(payload, config)
        return result

    def get_config_pr(self, config: UnderlyingConfig) -> pd.Series:
        if config.asset_type != "Basket":
            if not config.pr_ticker:
                raise DataUnavailableError(f"Ticker PR manquant pour {config.name}.")
            return self.provider.get_series(config.pr_ticker)
        components = config.basket_components
        if not components:
            raise DataUnavailableError(f"Basket vide pour {config.name}.")
        weights = np.array(config.basket_weights or [1 / len(components)] * len(components), dtype=float)
        weights = weights / weights.sum()
        frames = []
        used_weights = []
        for ticker, weight in zip(components, weights, strict=False):
            try:
                series = self.provider.get_series(ticker)
                frames.append((series / series.iloc[0] * 100).rename(ticker))
                used_weights.append(weight)
            except Exception:
                continue
        if not frames:
            raise DataUnavailableError(f"Aucun composant basket disponible pour {config.name}.")
        aligned = pd.concat(frames, axis=1).dropna()
        used = np.array(used_weights, dtype=float)
        used = used / used.sum()
        return aligned.mul(used, axis=1).sum(axis=1).rename(config.name)

    def dividend_series(self, config: UnderlyingConfig, pr: pd.Series, tr: pd.Series | None) -> pd.Series | None:
        if tr is not None:
            try:
                return DecrementScoreEngine.compute_implied_dividend_yield(pr, tr)
            except Exception:
                return None
        return None

    @staticmethod
    def filter_results(results: list[ScoreResult], filters: dict[str, Any]) -> list[ScoreResult]:
        asset_map = {"Indices": "Indice", "Actions": "Action", "Baskets": "Basket"}
        wanted_assets = {asset_map[item] for item in filters["asset_types"]}
        return [
            result
            for result in results
            if result.config.asset_type in wanted_assets
            and result.config.region in filters["regions"]
            and result.summary["dividend_annual_mean"] >= filters["min_dividend"]
            and result.summary["decrement_pct"] <= filters["max_decrement"]
            and GRADE_ORDER[result.grade] >= GRADE_ORDER[filters["min_grade"]]
        ]

    @staticmethod
    def render_sidebar_metrics(all_results: list[ScoreResult], filtered: list[ScoreResult]) -> None:
        st.sidebar.markdown("---")
        st.sidebar.metric("Univers filtré", f"{len(filtered)} / {len(all_results)}")
        avg = np.mean([result.score for result in filtered]) if filtered else np.nan
        st.sidebar.metric("Score moyen", f"{avg:.1f}" if np.isfinite(avg) else "N/A")
        best = filtered[0].config.name if filtered else "N/A"
        st.sidebar.metric("Meilleur sous-jacent", best)

    def render_ranking_table(self, results: list[ScoreResult]) -> None:
        if not results:
            st.info("Aucun sous-jacent ne correspond aux filtres.")
            return
        if any(self.uses_simulated_data(result) for result in results):
            st.error("⚠️ Au moins un score affiché repose sur des données simulées — non utilisable en production.")
        st.markdown("<div class='dec-table'>", unsafe_allow_html=True)
        st.markdown(
            "<div class='dec-row dec-head'><div>Nom + Type</div><div>Région</div><div>Déc%/an</div><div>Div%/an</div><div>Couverture div.</div><div>Drag 10Y</div><div>Scénario adverse</div><div>Score</div><div>Note</div></div>",
            unsafe_allow_html=True,
        )
        for result in results:
            s = result.summary
            source = result.data_sources.get("PR", "inconnu")
            href = f"?selected_underlying={quote(result.config.name, safe='')}"
            st.markdown(
                f"""
                <a class="dec-row dec-row-link" href="{href}" target="_self">
                  <div><strong>{result.config.name}</strong><small>{result.config.asset_type} · {self.source_badge(source)}</small></div>
                  <div>{result.config.region}</div>
                  <div>{s['decrement_pct']:.1f}%</div>
                  <div>{s['dividend_annual_mean']:.1f}%</div>
                  <div class="{self.sign_class(s['dividend_cushion'])}">{s['dividend_cushion']:+.1f}pts</div>
                  <div>{self.drag_text(s)}</div>
                  <div class="{self.severity_class(s['capital_loss_severity'])}">+{self.format_optional(s['capital_loss_severity'], 'pts')}</div>
                  <div><strong>{result.score:.0f}</strong></div>
                  <div>{self.grade_letters(result.grade)}</div>
                </a>
                """,
                unsafe_allow_html=True,
            )
        st.markdown("</div>", unsafe_allow_html=True)

    def render_detail(self, selected_name: str) -> None:
        results = st.session_state.get("score_results", [])
        if not results:
            results = self.score_universe()
        result = next((item for item in results if item.config.name == selected_name), None)
        if result is None:
            st.session_state["selected_underlying"] = None
            self.clear_query_params()
            st.rerun()
        if st.button("← Retour"):
            st.session_state["selected_underlying"] = None
            self.clear_query_params()
            st.rerun()
        st.markdown(
            f"<div class='dec-detail-header'><div><h2>{result.config.name}</h2><span>{result.config.asset_type} · {result.config.region} · {self.source_badge(result.data_sources.get('PR', 'inconnu'))}</span></div><div class='dec-score'>{result.score:.0f}<small>/100 · {result.grade}</small></div></div>",
            unsafe_allow_html=True,
        )
        if self.uses_simulated_data(result):
            st.error("⚠️ Score calculé sur données simulées — non utilisable pour une recommandation client.")
        tab_score, tab_graphs, tab_criteria, tab_compare = st.tabs(["Score & Verdict", "Analyse Graphique", "Détail Critères", "Comparateur"])
        with tab_score:
            self.render_score_tab(result)
        with tab_graphs:
            self.render_graph_tab(result)
        with tab_criteria:
            self.render_criteria_tab(result)
        with tab_compare:
            self.render_comparator_tab(result, results)

    def render_score_tab(self, result: ScoreResult) -> None:
        left, right = st.columns([0.42, 0.58])
        with left:
            st.plotly_chart(self.gauge(result.score), use_container_width=True)
            if st.button("Voir l'historique"):
                with st.spinner("Calcul de l'historique..."):
                    self.compute_score_history(result)
            self.render_score_history(result)
            st.markdown(self.strict_verdict(result), unsafe_allow_html=True)
            st.markdown(self.client_profile_badge(result), unsafe_allow_html=True)
        with right:
            st.plotly_chart(self.radar(result), use_container_width=True)
            self.render_summary_metrics(result)
            with st.expander("📋 Texte pour dossier client", expanded=False):
                client = st.text_input("Nom client", key=f"client_{result.config.name}")
                product = st.text_input("Nom produit", key=f"product_{result.config.name}")
                issuer = st.text_input("Émetteur", key=f"issuer_{result.config.name}")
                client_text = self.client_text(result, client or "le client", product or "le produit", issuer or "l'émetteur")
                st.text_area("Texte auto-généré", client_text, height=220)
                st.code(client_text, language="text")
                if st.button("Copier", key=f"copy_{result.config.name}"):
                    st.session_state[f"copied_text_{result.config.name}"] = client_text
                    st.success("Texte prêt à copier depuis le bloc ci-dessus.")
            client = st.session_state.get(f"client_{result.config.name}", "")
            product = st.session_state.get(f"product_{result.config.name}", "")
            issuer = st.session_state.get(f"issuer_{result.config.name}", "")
            col_a, col_b = st.columns(2)
            with col_a:
                st.download_button("📄 PDF Technique", self.report.generate_technical_pdf(result), file_name=f"{result.config.name}_technique.pdf")
            with col_b:
                st.download_button("📋 PDF Client", self.report.generate_client_pdf(result, client, product, issuer), file_name=f"{result.config.name}_client.pdf")
        if result.warnings:
            for warning in result.warnings:
                st.caption(warning)

    def render_graph_tab(self, result: ScoreResult) -> None:
        if go is None:
            st.error("plotly est requis pour afficher les graphiques.")
            return
        pr, il = self.normalize_pair(result.price_return, result.synthetic_decrement)
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=pr.index, y=pr, name="PR", line=dict(color=THEME["blue"])))
        fig.add_trace(go.Scatter(x=il.index, y=il, name="IL décrémenté", line=dict(color=THEME["gold"]), fill="tonexty", fillcolor="rgba(248,113,113,0.18)"))
        self.add_crisis_annotations(fig, pr.index)
        self.apply_plot_theme(fig, "PR vs IL rebased 100")
        st.plotly_chart(fig, use_container_width=True)

        annual = DecrementScoreEngine.annual_dividends(result.dividend_yield_daily)
        fig_div = go.Figure()
        if annual.empty:
            annual = pd.Series(result.summary["dividend_annual_mean"], index=pd.date_range(result.snapshot_date - pd.DateOffset(years=9), periods=10, freq="YE"))
        fig_div.add_trace(go.Bar(x=annual.index, y=annual, name="Dividende annuel", marker_color=THEME["green"]))
        fig_div.add_trace(go.Scatter(x=annual.index, y=[result.summary["decrement_pct"]] * len(annual), name="Décrément", line=dict(color=THEME["red"])))
        scissor = int((annual < result.summary["decrement_pct"]).sum())
        self.apply_plot_theme(fig_div, f"Dividende annuel vs décrément · {scissor} années avec effet ciseau")
        st.plotly_chart(fig_div, use_container_width=True)

        dd_pr = pr / pr.cummax() - 1
        dd_il = il / il.cummax() - 1
        fig_dd = go.Figure()
        fig_dd.add_trace(go.Scatter(x=dd_pr.index, y=dd_pr * 100, name="Drawdown PR", line=dict(color=THEME["blue"])))
        fig_dd.add_trace(go.Scatter(x=dd_il.index, y=dd_il * 100, name="Drawdown IL", line=dict(color=THEME["gold"])))
        self.apply_plot_theme(fig_dd, "Underwater chart drawdowns comparés")
        st.plotly_chart(fig_dd, use_container_width=True)

        recall = DecrementScoreEngine.compute_recall_efficiency(result.price_return, result.synthetic_decrement)
        windows = recall.get("windows", [])
        if windows:
            frame = pd.DataFrame(windows)
            frame["year"] = pd.to_datetime(frame["start"]).dt.year
            hist = frame.groupby("year")["dec_recalled"].mean() * 100
            fig_recall = go.Figure(go.Bar(x=hist.index, y=hist.values, marker_color=THEME["gold"]))
            self.apply_plot_theme(fig_recall, "Histogramme recall rate par année de lancement")
            st.plotly_chart(fig_recall, use_container_width=True)
        self.render_score_history(result)

    def render_criteria_tab(self, result: ScoreResult) -> None:
        formulas = {
            "Coverage Ratio": "dividend_annual_mean / decrement_pct_moyen",
            "Performance Drag": "0.50×drag_10Y + 0.35×drag_5Y + 0.15×drag_3Y",
            "Stress Test": "3 pires drawdowns non chevauchants PR, malus par type de décrément",
            "Recall Efficiency": "Backtest rolling Athena 100%/60%/annuel, starts[::21]",
            "Dividend Stability": "CV + worst_drop + pct_years_below sur dividendes annuels agrégés",
            "Trend Survival": "% de jours IL_t > IL_0 sur fenêtres 10Y",
            "Capital Loss Severity": "Amplification moyenne des pertes sur fenêtres non rappelées",
            "Path Dependency": "Drag cumulé 3Y sur marchés latéraux ±15%",
            "Dividend Trend": "Régression OLS sur dividendes annuels 10Y",
        }
        for name, weight in WEIGHTS.items():
            with st.expander(f"{name} · {weight:.0%}", expanded=False):
                value = result.criteria_scores.get(name, np.nan)
                st.metric("Score partiel", "Neutralisé" if not np.isfinite(value) else f"{value:.0f}/100")
                st.caption(formulas[name])
                if name == "Capital Loss Severity":
                    st.write(f"Fenêtres non-rappelées: {result.summary['non_recalled_windows']} / {result.summary['total_windows']}")
                if name == "Path Dependency":
                    st.write(f"Périodes latérales identifiées: {result.summary['lateral_windows']}")
                if name == "Dividend Trend":
                    st.write(f"Pente: {result.summary['dividend_trend_slope']:.2f}%/an · R²: {result.summary['dividend_trend_r2']:.2f}")
                st.write(self.interpret_criterion(value))

    def render_comparator_tab(self, current: ScoreResult, results: list[ScoreResult]) -> None:
        other_name = st.selectbox("Sous-jacent à comparer", [item.config.name for item in results], index=0)
        other = next(item for item in results if item.config.name == other_name)
        col_a, col_b = st.columns(2)
        with col_a:
            st.markdown(f"### {current.config.name}")
            st.metric("Score", f"{current.score:.0f} · {current.grade}")
            coupon_a = st.number_input("Coupon A (%)", value=8.0, step=0.1, key="coupon_a")
        with col_b:
            st.markdown(f"### {other.config.name}")
            st.metric("Score", f"{other.score:.0f} · {other.grade}")
            coupon_b = st.number_input("Coupon B (%)", value=8.5, step=0.1, key="coupon_b")
        st.caption("Coupon saisi manuellement — source : term sheet banque")
        analysis = self.compare_results(current, other, coupon_a, coupon_b)
        st.markdown(
            f"""
            <div class="dec-verdict">
            <b>Analyse du compromis</b><br>
            Gain coupon brut : {analysis['delta_coupon']:+.2f}%/an<br>
            Coût décrément net : {analysis['net_cost']:+.2f}%/an<br>
            Drag différentiel : {analysis['delta_drag']:+.2f}%/an<br>
            Avantage réel estimé : {analysis['advantage']:+.2f}%/an<br><br>
            {analysis['verdict']}
            </div>
            """,
            unsafe_allow_html=True,
        )
        if go is not None:
            if other.price_return.empty:
                st.warning("Données insuffisantes pour le sous-jacent B.")
                return
            pr_a, il_a = self.normalize_pair(current.price_return, current.synthetic_decrement)
            pr_b = other.price_return / other.price_return.iloc[0] * 100
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=pr_a.index, y=pr_a, name="Indice A standard", line=dict(color=THEME["blue"])))
            fig.add_trace(go.Scatter(x=il_a.index, y=il_a, name="Indice A décrémenté", line=dict(color=THEME["gold"])))
            fig.add_trace(go.Scatter(x=pr_b.index, y=pr_b, name="Indice B standard", line=dict(color=THEME["green"])))
            self.apply_plot_theme(fig, "Comparatif historique rebased 100")
            st.plotly_chart(fig, use_container_width=True)
        st.download_button("📋 PDF Comparatif Client", self.report.generate_comparison_pdf(current, other, coupon_a, coupon_b), file_name="comparatif_decrement.pdf")

    def compute_score_history(self, result: ScoreResult) -> None:
        st.session_state.setdefault("score_history", {})
        snapshots = [0, 6, 12, 24, 36]
        history = []
        for months in snapshots:
            cutoff = result.snapshot_date - pd.DateOffset(months=months)
            pr = result.price_return[result.price_return.index <= cutoff]
            if DecrementScoreEngine.history_years(pr.index) < MIN_HISTORY_YEARS:
                continue
            div_truncated = None
            if result.dividend_yield_daily is not None and not result.dividend_yield_daily.empty:
                div_truncated = result.dividend_yield_daily[result.dividend_yield_daily.index <= cutoff]
            try:
                partial = self.engine.score_underlying(result.config, pr, None, div_truncated)
                history.append({"date": cutoff, "score": partial.score, "grade": partial.grade, "criteria": partial.criteria_scores})
            except Exception:
                continue
        st.session_state["score_history"][result.config.name] = sorted(history, key=lambda row: row["date"])

    def render_score_history(self, result: ScoreResult) -> None:
        history = st.session_state.get("score_history", {}).get(result.config.name)
        if not history:
            return
        dates = [row["date"] for row in history]
        scores = [row["score"] for row in history]
        if go is not None:
            fig = go.Figure(go.Scatter(x=dates, y=scores, mode="lines+markers", line=dict(color=THEME["gold"])))
            self.apply_plot_theme(fig, "Score timeline")
            st.plotly_chart(fig, use_container_width=True)
        old = history[0]
        new = history[-1]
        phrase = f"Le score de {result.config.name} a évolué de {old['grade']} ({old['score']:.0f}) en {old['date']:%d/%m/%Y} à {new['grade']} ({new['score']:.0f}) aujourd'hui."
        if new["score"] < old["score"]:
            degraded = self.most_degraded_criterion(old["criteria"], new["criteria"])
            phrase += f" Cette dégradation est principalement due à {degraded}."
        st.caption(phrase)

    @staticmethod
    def compare_results(left: ScoreResult, right: ScoreResult, left_coupon: float, right_coupon: float) -> dict[str, float | str]:
        delta_coupon = right_coupon - left_coupon
        net_cost = (
            left.summary["decrement_pct"]
            - left.summary["dividend_annual_mean"]
            - right.summary["decrement_pct"]
            + right.summary["dividend_annual_mean"]
        )
        delta_drag = right.summary["drag_composite"] - left.summary["drag_composite"]
        advantage = delta_coupon - max(net_cost, 0) - max(delta_drag, 0)
        if advantage > 1:
            verdict = "Le supplément de coupon compense largement le coût du décrément."
        elif advantage > 0.25:
            verdict = "Le supplément de coupon couvre partiellement le coût du décrément."
        elif advantage >= -0.25:
            verdict = "Le coupon supplémentaire couvre à peine le coût du décrément."
        else:
            verdict = "Ce décrément n'est pas compensé par le coupon proposé."
        return {
            "delta_coupon": float(delta_coupon),
            "net_cost": float(net_cost),
            "delta_drag": float(delta_drag),
            "advantage": float(advantage),
            "verdict": verdict,
        }

    @staticmethod
    def client_text(result: ScoreResult, client: str, product: str, issuer: str) -> str:
        s = result.summary
        config = result.config
        d = config.decrement_value if config.decrement_value is not None else s["decrement_equivalent"]
        unit = config.decrement_currency
        variables = {
            "produit": product,
            "emetteur": issuer,
            "config": config,
            "D": d,
            "unite": unit,
            "div_mean": s["dividend_annual_mean"],
            "coverage": s["coverage_ratio"],
            "drag": s["drag_composite"],
            "severity": s["capital_loss_severity"],
            "score": f"{result.score:.0f}",
            "grade": result.grade,
            "client": client,
        }
        if result.grade == "A":
            body = (
                "Dans le cadre de la recommandation du produit {produit} émis par {emetteur}, le sous-jacent {config.name} utilise un mécanisme de décrément de {D} {unite}/an. "
                "Sur la base des données historiques publiques disponibles, ce décrément est intégralement couvert par le dividende historique de l'indice ({div_mean:.1f}%/an, ratio de couverture : {coverage:.2f}x). "
                "L'impact historique sur la performance annualisée est de {drag:.1f}%/an. Dans les scénarios de non-rappel, l'amplification de la perte par le décrément est estimée à {severity:.1f} points de pourcentage. "
                "Ce mécanisme est considéré comme économiquement justifié au regard des données historiques disponibles. Note Decrement Score : {grade} ({score}/100)."
            )
        elif result.grade == "B":
            body = (
                "Dans le cadre de la recommandation du produit {produit} émis par {emetteur}, le sous-jacent {config.name} utilise un mécanisme de décrément de {D} {unite}/an. "
                "Ce décrément est partiellement couvert par le dividende historique ({div_mean:.1f}%/an, ratio : {coverage:.2f}x). L'impact sur la performance annualisée est de {drag:.1f}%/an. "
                "En cas de non-rappel, le décrément amplifie la perte de {severity:.1f} points en moyenne. Ce mécanisme présente un coût modéré, compensé par le supplément de coupon à vérifier sur la term sheet. "
                "Note Decrement Score : {grade} ({score}/100)."
            )
        elif result.grade == "C":
            body = (
                "Dans le cadre de la recommandation du produit {produit} émis par {emetteur}, le sous-jacent {config.name} utilise un mécanisme de décrément de {D} {unite}/an. "
                "Le dividende historique ({div_mean:.1f}%/an) ne couvre que partiellement ce mécanisme (ratio : {coverage:.2f}x). L'impact sur la performance annualisée est de {drag:.1f}%/an. "
                "En cas de non-rappel à maturité, la perte est amplifiée de {severity:.1f} points en moyenne par rapport à l'indice standard. Il convient d'expliquer à {client} que le coupon perçu reflète en partie une performance future sacrifiée. "
                "Note Decrement Score : {grade} ({score}/100)."
            )
        else:
            body = (
                "Dans le cadre de la recommandation du produit {produit} émis par {emetteur}, le sous-jacent {config.name} utilise un mécanisme de décrément de {D} {unite}/an significativement supérieur au dividende historique ({div_mean:.1f}%/an, ratio : {coverage:.2f}x). "
                "L'impact sur la performance annualisée est de {drag:.1f}%/an. En cas de non-rappel, la perte est amplifiée de {severity:.1f} points. "
                "Il convient de mettre en garde {client} sur le fait que le coupon perçu reflète en grande partie une érosion du sous-jacent et non une rémunération du risque pur. "
                "Note Decrement Score : {grade} ({score}/100)."
            )
        regulatory = (
            "\n\nCe document est établi sur la base de données historiques publiques et ne constitue pas un conseil en investissement au sens de la directive MiFID II. "
            "L'analyse du caractère adapté du produit à la situation personnelle du client demeure de la responsabilité du conseiller en gestion de patrimoine."
        )
        return body.format(**variables) + regulatory

    @staticmethod
    def gauge(score: float) -> go.Figure:
        if go is None:
            raise ImportError("plotly est requis pour afficher la jauge.")
        fig = go.Figure(go.Indicator(mode="gauge+number", value=score, number={"suffix": "/100"}, gauge={"axis": {"range": [0, 100]}, "bar": {"color": THEME["gold"]}, "bgcolor": THEME["panel_2"]}))
        DecrementScoreUI.apply_plot_theme(fig, "")
        fig.update_layout(height=270)
        return fig

    @staticmethod
    def radar(result: ScoreResult) -> go.Figure:
        if go is None:
            raise ImportError("plotly est requis pour afficher le radar.")
        names = list(WEIGHTS)
        values = [0 if not np.isfinite(result.criteria_scores.get(name, np.nan)) else result.criteria_scores[name] for name in names]
        fig = go.Figure(go.Scatterpolar(r=values + [values[0]], theta=names + [names[0]], fill="toself", line=dict(color=THEME["gold"])))
        fig.update_layout(polar=dict(radialaxis=dict(range=[0, 100], gridcolor=THEME["border"])), showlegend=False, height=360)
        DecrementScoreUI.apply_plot_theme(fig, "Radar 9 critères")
        return fig

    @staticmethod
    def apply_plot_theme(fig: go.Figure, title: str) -> None:
        fig.update_layout(
            title=title,
            template="plotly_dark",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor=THEME["panel"],
            font=dict(color=THEME["text"]),
            margin=dict(l=30, r=30, t=50 if title else 20, b=30),
        )

    @staticmethod
    def add_crisis_annotations(fig: go.Figure, index: pd.Index) -> None:
        if len(index) == 0:
            return
        min_date = pd.Timestamp(index.min())
        max_date = pd.Timestamp(index.max())
        crises = [
            ("2008", pd.Timestamp("2008-09-15")),
            ("Covid", pd.Timestamp("2020-03-16")),
            ("Taux 2022", pd.Timestamp("2022-09-30")),
        ]
        for label, date in crises:
            if min_date <= date <= max_date:
                fig.add_vline(x=date, line_width=1, line_dash="dot", line_color="rgba(255,255,255,0.35)")
                fig.add_annotation(x=date, y=1, yref="paper", text=label, showarrow=False, font=dict(size=10, color=THEME["text_2"]))

    @staticmethod
    def normalize_pair(a: pd.Series, b: pd.Series) -> tuple[pd.Series, pd.Series]:
        aligned = pd.concat([a.rename("a"), b.rename("b")], axis=1).dropna()
        return aligned["a"] / aligned["a"].iloc[0] * 100, aligned["b"] / aligned["b"].iloc[0] * 100

    @staticmethod
    def render_summary_metrics(result: ScoreResult) -> None:
        s = result.summary
        rows = {
            "Dividende historique": f"{s['dividend_annual_mean']:.1f}%",
            "Coût décrément": f"{s['decrement_pct']:.1f}%",
            "Couverture": f"{s['coverage_ratio']:.2f}x",
            "Drag composite": f"{s['drag_composite']:.1f}%/an",
            "Scénario adverse": f"+{s['capital_loss_severity']:.1f}pts",
            "Base utilisée": result.decrement_base_used,
            "Historique": f"{result.history_years:.1f} ans",
            "Snapshot": f"{result.snapshot_date:%d/%m/%Y}",
            "Source": result.data_sources.get("PR", "inconnu"),
        }
        st.markdown("<div class='dec-metrics'>" + "".join(f"<div><span>{k}</span><b>{v}</b></div>" for k, v in rows.items()) + "</div>", unsafe_allow_html=True)

    @staticmethod
    def source_badge(source: str) -> str:
        label, color = SOURCE_LABELS.get(source, SOURCE_LABELS["inconnu"])
        return f"<span class='source-badge' style='color:{color}'>● {label}</span>"

    @staticmethod
    def grade_letters(active: str) -> str:
        letters = ["E", "D", "C", "B", "A"]
        return "".join(f"<span class='grade-letter {'on' if letter == active else ''} grade-{letter}'>{letter}</span>" for letter in letters)

    @staticmethod
    def drag_text(summary: dict[str, Any]) -> str:
        annual_value = summary.get("drag_10y")
        cumulative_value = summary.get("drag_10y_cumulative")
        if not np.isfinite(annual_value):
            annual_value = summary.get("drag_5y")
            cumulative_value = summary.get("drag_5y_cumulative", cumulative_value)
        if not np.isfinite(annual_value):
            return "< 5 ans de données"
        annual = DecrementScoreUI.format_optional(annual_value, "%/an")
        cumulative = DecrementScoreUI.format_optional(cumulative_value, "% cumulé")
        if annual == "N/A":
            return "< 5 ans de données"
        if cumulative == "N/A":
            return f"-{annual}"
        return f"-{annual} · -{cumulative}"

    @staticmethod
    def uses_simulated_data(result: ScoreResult) -> bool:
        return any(source == "hardcoded" for source in result.data_sources.values())

    @staticmethod
    def sign_class(value: float) -> str:
        return "pos" if value >= 0 else "neg"

    @staticmethod
    def severity_class(value: float) -> str:
        if not np.isfinite(value) or value < 5:
            return "pos"
        if value < 15:
            return "warn"
        return "neg"

    @staticmethod
    def format_optional(value: Any, suffix: str = "") -> str:
        try:
            if value is None or not np.isfinite(float(value)):
                return "N/A"
            return f"{float(value):.1f}{suffix}"
        except Exception:
            return "N/A"

    @staticmethod
    def client_profile_badge(result: ScoreResult) -> str:
        if result.grade in {"A", "B"}:
            text = "Profil investisseur : mécanisme lisible, coût historiquement modéré."
        elif result.grade == "C":
            text = "Profil investisseur : explicitation renforcée du compromis coupon / érosion."
        else:
            text = "Profil investisseur : vigilance élevée, coût de décrément significatif."
        return f"<div class='dec-profile'>{text}</div>"

    @staticmethod
    def strict_verdict(result: ScoreResult) -> str:
        s = result.summary
        coverage_text = (
            "Le dividende historique couvre le coût du décrément."
            if s["coverage_ratio"] >= 1
            else "Le dividende historique ne couvre pas intégralement le coût du décrément."
        )
        recall_text = (
            "Les critères Recall Efficiency et Capital Loss Severity sont neutralisés faute d'historique suffisant."
            if s["recall_neutralized"]
            else f"Sur les fenêtres testées, {s['non_recalled_windows']} fenêtres non-rappelées sont identifiées sur {s['total_windows']}."
        )
        conclusion = (
            "Ce sous-jacent peut être utilisé comme support de structuration, sous réserve de vérifier le coupon proposé."
            if result.grade in {"A", "B"}
            else "Ce sous-jacent nécessite une justification renforcée du supplément de coupon et du transfert de performance vers l'investisseur."
        )
        return f"""
        <div class="dec-verdict">
          <p>{coverage_text} Dividende moyen : {s['dividend_annual_mean']:.1f}%/an, coût du décrément : {s['decrement_pct']:.1f}%/an, couverture : {s['coverage_ratio']:.2f}x.</p>
          <p>{recall_text} Le scénario adverse ajoute {s['capital_loss_severity']:.1f} points de perte moyenne en cas de non-rappel.</p>
          <p>{conclusion} Score final : {result.score:.0f}/100, note {result.grade}.</p>
        </div>
        """

    @staticmethod
    def interpret_criterion(score: float) -> str:
        if not np.isfinite(score):
            return "Critère neutralisé faute d'historique suffisant."
        if score >= 75:
            return "Critère robuste pour une structuration avec décrément."
        if score >= 50:
            return "Critère acceptable mais à surveiller."
        return "Critère fragile, potentiellement défavorable pour l'investisseur."

    @staticmethod
    def most_degraded_criterion(old: dict[str, float], new: dict[str, float]) -> str:
        candidates = []
        for name in old:
            if np.isfinite(old.get(name, np.nan)) and np.isfinite(new.get(name, np.nan)):
                candidates.append((old[name] - new[name], name))
        return max(candidates, default=(0.0, "Performance Drag"))[1]

    @staticmethod
    def inject_css() -> None:
        if st.session_state.get("decrement_css_injected"):
            return
        st.session_state["decrement_css_injected"] = True
        st.markdown(
            f"""
            <style>
            .stApp {{ background:{THEME['bg']}; color:{THEME['text']}; }}
            .dec-title {{ font-size:32px; font-weight:800; color:{THEME['text']}; margin-bottom:18px; letter-spacing:-.03em; }}
            .dec-table {{ border:1px solid {THEME['border']}; border-radius:18px; overflow:hidden; background:{THEME['panel']}; }}
            .dec-row {{ display:grid; grid-template-columns:2.2fr .8fr .75fr .75fr 1fr 1.2fr 1.1fr .65fr .9fr; gap:12px; align-items:center; padding:13px 16px; border-bottom:1px solid {THEME['border']}; font-size:13px; color:{THEME['text']}; }}
            .dec-row:hover {{ background:{THEME['hover']}; }}
            .dec-row-link {{ text-decoration:none; color:inherit; }}
            .dec-row small {{ display:block; margin-top:3px; color:{THEME['text_3']}; }}
            .dec-head {{ color:{THEME['gold']}; text-transform:uppercase; font-size:10px; letter-spacing:.08em; background:{THEME['panel_2']}; }}
            .dec-detail-header,.dec-verdict,.dec-profile,.dec-metrics {{ border:1px solid {THEME['border']}; border-radius:18px; background:{THEME['panel']}; padding:18px; }}
            .dec-detail-header {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }}
            .dec-detail-header h2 {{ margin:0; color:{THEME['text']}; }}
            .dec-detail-header span {{ color:{THEME['text_2']}; }}
            .dec-score {{ font-size:42px; font-weight:800; color:{THEME['gold']}; text-align:right; }}
            .dec-score small {{ display:block; font-size:13px; color:{THEME['text_2']}; }}
            .dec-metrics {{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:12px 0; }}
            .dec-metrics div {{ background:{THEME['panel_2']}; border-radius:12px; padding:10px; }}
            .dec-metrics span {{ display:block; color:{THEME['text_3']}; font-size:11px; }}
            .dec-metrics b {{ color:{THEME['text']}; }}
            .pos {{ color:{THEME['green']}; font-weight:700; }} .neg {{ color:{THEME['red']}; font-weight:700; }} .warn {{ color:{THEME['orange']}; font-weight:700; }}
            .grade-letter {{ display:inline-flex; opacity:.35; width:20px; height:20px; align-items:center; justify-content:center; border-radius:999px; margin-right:2px; background:{THEME['panel_2']}; }}
            .grade-letter.on {{ opacity:1; color:#0d1b2a; font-weight:800; }}
            .grade-A.on {{ background:{THEME['green']}; }} .grade-B.on {{ background:#8bd17c; }} .grade-C.on {{ background:{THEME['gold']}; }} .grade-D.on {{ background:{THEME['orange']}; }} .grade-E.on {{ background:{THEME['red']}; }}
            .source-badge {{ font-size:11px; font-weight:700; }}
            </style>
            """,
            unsafe_allow_html=True,
        )

    @staticmethod
    def get_query_param(name: str) -> str | None:
        try:
            value = st.query_params.get(name)
            if isinstance(value, list):
                return value[0] if value else None
            return value
        except Exception:
            value = st.experimental_get_query_params().get(name, [None])
            return value[0]

    @staticmethod
    def clear_query_params() -> None:
        try:
            st.query_params.clear()
        except Exception:
            st.experimental_set_query_params()


if __name__ == "__main__":
    DecrementScoreUI().render()
