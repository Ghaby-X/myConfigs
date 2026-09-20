return {
  {
    "christoomey/vim-tmux-navigator",
    cmd = {
      "TmuxNavigateLeft",
      "TmuxNavigateDown",
      "TmuxNavigateUp",
      "TmuxNavigateRight",
      "TmuxNavigatePrevious",
      "TmuxNavigatorProcessList",
    },
    keys = {
      { "<c-h>", "<cmd>TmuxNavigateLeft<cr>", desc = "Navigate Left" },
      { "<c-j>", "<cmd>TmuxNavigateDown<cr>", desc = "Navigate Down" },
      { "<c-k>", "<cmd>TmuxNavigateUp<cr>", desc = "Navigate Up" },
      { "<c-l>", "<cmd>TmuxNavigateRight<cr>", desc = "Navigate Right" },
      { "<c-\\>", "<cmd>TmuxNavigatePrevious<cr>", desc = "Navigate Previous" },
    },
  },
}
