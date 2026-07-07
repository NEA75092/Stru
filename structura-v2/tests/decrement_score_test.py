import unittest
from pathlib import Path
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from decrement_score import (
    CALENDAR_DAYS_PER_YEAR,
    DecrementScoreEngine,
    DecrementScoreUI,
    UnderlyingConfig,
    _cached_score_underlying_impl,
    _series_to_json,
    _score_result_from_payload,
)


class DecrementScoreEngineTest(unittest.TestCase):
    def test_reconstruct_uses_actual_calendar_days(self):
        index = pd.to_datetime(["2024-01-01", "2024-01-04"])
        base = pd.Series([100.0, 100.0], index=index, name="TR_BASE")

        result = DecrementScoreEngine.reconstruct_synthetic_decrement(base, 36.5)

        self.assertAlmostEqual(result.iloc[1], 99.7, places=6)

    def test_annual_dividend_mean_uses_act_365(self):
        index = pd.date_range("2024-01-01", periods=10, freq="D")
        daily_yield = pd.Series(0.02 / CALENDAR_DAYS_PER_YEAR, index=index)

        result = DecrementScoreEngine.annual_dividend_mean(daily_yield, 0.0)

        self.assertAlmostEqual(result, 2.0, places=6)

    def test_recall_efficiency_is_computed_with_sufficient_history(self):
        index = pd.date_range("2005-01-01", "2025-12-31", freq="ME")
        pr = pd.Series(np.linspace(100, 180, len(index)), index=index)
        dec = pd.Series(np.linspace(100, 150, len(index)), index=index)

        result = DecrementScoreEngine.compute_recall_efficiency(pr, dec)

        self.assertFalse(result["neutralized"])
        self.assertGreaterEqual(result["recall_efficiency"], 0)
        self.assertLessEqual(result["recall_efficiency"], 1)

    def test_decrement_equivalent_uses_configured_eur_amount(self):
        index = pd.date_range("2024-01-01", periods=3, freq="D")
        prices = pd.Series([50.0, 51.0, 52.0], index=index)
        config = UnderlyingConfig(
            name="Action Test",
            asset_type="Action",
            region="Europe",
            pr_ticker="TEST",
            decrement_type="eur",
            decrement_eur=1.2,
            fallback_dividend_yield=4.0,
        )

        result = DecrementScoreEngine.decrement_equivalent(config, prices, dividend_mean=4.0)

        self.assertEqual(result, 1.2)

    def test_annual_dividend_mean_uses_short_history_when_under_10_years(self):
        index = pd.date_range("2022-01-01", "2024-12-31", freq="D")
        daily_yield = pd.Series(0.03 / CALENDAR_DAYS_PER_YEAR, index=index)

        result = DecrementScoreEngine.annual_dividend_mean(daily_yield, 0.0)

        self.assertAlmostEqual(result, 3.0, places=1)

    def test_drag_text_falls_back_to_five_year_window(self):
        summary = {
            "drag_10y": float("nan"),
            "drag_10y_cumulative": float("nan"),
            "drag_5y": 1.8,
            "drag_5y_cumulative": 9.0,
        }
        text = DecrementScoreUI.drag_text(summary)
        self.assertEqual(text, "-1.8%/an · -9.0% cumulé")

    def test_drag_text_reports_insufficient_history(self):
        summary = {
            "drag_10y": float("nan"),
            "drag_10y_cumulative": float("nan"),
            "drag_5y": float("nan"),
            "drag_5y_cumulative": float("nan"),
        }
        self.assertEqual(DecrementScoreUI.drag_text(summary), "< 5 ans de données")

    def test_recall_efficiency_subsamples_daily_history_monthly(self):
        index = pd.date_range("2000-01-01", "2025-12-31", freq="D")
        pr = pd.Series(np.linspace(100, 180, len(index)), index=index)
        dec = pd.Series(np.linspace(100, 150, len(index)), index=index)

        result = DecrementScoreEngine.compute_recall_efficiency(pr, dec)

        self.assertFalse(result["neutralized"])
        self.assertGreaterEqual(result["recall_efficiency"], 0)

    def test_cached_score_underlying_serializes_pandas_series(self):
        index = pd.date_range("2010-01-01", periods=4000, freq="D")
        pr = pd.Series(np.linspace(100, 150, len(index)), index=index)
        config = UnderlyingConfig(
            name="Cache Test",
            asset_type="Indice",
            region="Europe",
            pr_ticker="TEST",
            decrement_type="points",
            decrement_value=30.0,
            fallback_dividend_yield=3.0,
        )
        payload = _cached_score_underlying_impl(
            config.__dict__,
            _series_to_json(pr),
            None,
            None,
            '{"PR": "cache"}',
        )
        result = _score_result_from_payload(payload, config)
        self.assertGreater(result.score, 0)
        self.assertEqual(result.data_sources["PR"], "cache")
        self.assertEqual(len(result.price_return), len(pr))


if __name__ == "__main__":
    unittest.main()
