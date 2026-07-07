"""STRUCTURA PRO v2 Streamlit shell.

This file provides the minimal Python integration requested for the
Decrement Score Screener.
"""

from __future__ import annotations

import streamlit as st

from decrement_score import DecrementScoreUI


NAVY = "#0d1b2a"
GOLD = "#c9a84c"


def apply_structura_theme() -> None:
    """Apply STRUCTURA dark navy/gold theme.

    Returns
    -------
    None
    """

    st.markdown(
        f"""
        <style>
        .stApp {{ background: {NAVY}; }}
        section[data-testid="stSidebar"] {{ background: #111f33; }}
        .stButton button {{ background: {GOLD}; color: {NAVY}; border: 0; }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    """Render STRUCTURA PRO v2."""

    st.set_page_config(page_title="STRUCTURA PRO v2", layout="wide")
    apply_structura_theme()
    page = st.sidebar.radio(
        "Navigation",
        ["Dashboard", "▣ Pitch Engine", "◎ Decrement Score"],
        index=2,
    )
    if page == "◎ Decrement Score":
        DecrementScoreUI().render()
    else:
        st.title("STRUCTURA PRO v2")
        st.info("Module placeholder. Le Screener Decrement Score est disponible dans la sidebar.")


if __name__ == "__main__":
    main()
