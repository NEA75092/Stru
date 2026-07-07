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
    function nav(viewId) {
      if (typeof document === "undefined") return;
      document
        .querySelectorAll(".nav-tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".view")
        .forEach((view) => view.classList.remove("active"));

      document.getElementById("tab-" + viewId)?.classList.add("active");
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

    return { nav };
  },
);
