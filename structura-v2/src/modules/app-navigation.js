(function initStructuraNavigation(root, factory) {
  const api = factory(root);
  root.StructuraNavigation = api;
  root.nav = api.nav;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraNavigation(root) {
    function positionNavIndicator(tab) {
      const indicator = document.getElementById("nav-indicator");
      if (!indicator || !tab) return;
      indicator.style.height = `${tab.offsetHeight}px`;
      indicator.style.transform = `translateY(${tab.offsetTop}px)`;
    }

    function nav(viewId) {
      if (typeof document === "undefined") return;
      document
        .querySelectorAll(".nav-tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".view")
        .forEach((view) => view.classList.remove("active"));

      const activeTab = document.getElementById("tab-" + viewId);
      activeTab?.classList.add("active");
      positionNavIndicator(activeTab);
      const targetView = document.getElementById("view-" + viewId);
      targetView?.classList.add("active");

      if (root.StructuraAppState?.runtime) {
        root.StructuraAppState.runtime.currentView = viewId;
      }

      if (targetView?.scrollTo) {
        targetView.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (viewId === "dashboard") {
        root.renderDashboardSummary?.();
        root.renderAlerts?.();
        root.renderEvents?.();
        root.drawPerfChart?.();
        root.renderDashboardModules?.();
      }
      if (viewId === "portfolio") root.renderPf?.();
      if (viewId === "barriers") root.renderBarriers?.();
      if (viewId === "analytics") root.renderAnalytics?.();
      if (viewId === "calendar") root.renderCalendar?.();
      if (viewId === "clients") root.renderClients?.();
      if (viewId === "screener") root.runScreener?.();
    }

    if (typeof document !== "undefined") {
      // Scripts load with `defer`, so the DOM is already fully parsed
      // by the time this module runs — no need to wait for an event.
      positionNavIndicator(document.querySelector(".nav-tab.active"));
    }

    return { nav, positionNavIndicator };
  },
);
