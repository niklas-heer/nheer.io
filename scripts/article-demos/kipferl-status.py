import tui

tui.box("Three services. One small executable.", title="Release check")
tui.table([
    ["Service", "Status"],
    ["api", "ready"],
    ["worker", "ready"],
    ["coffee", "critical"],
], headers=True)
tui.success("Application ready. Coffee needs attention.")
