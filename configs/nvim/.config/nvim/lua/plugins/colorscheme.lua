-- One Dark Pro, recolored from the active rice theme (see lua/rice/init.lua and
-- configs/theme/.config/rice/templates/nvim-palette.lua.tpl). Falls back to the plain
-- One Dark palette until a theme has been applied.
return {
  {
    "olimorris/onedarkpro.nvim",
    priority = 1000, -- load before other plugins
    opts = function()
      return require("rice").opts()
    end,
  },

  -- Tell LazyVim to use it (onedark, or onelight for light themes)
  {
    "LazyVim/LazyVim",
    opts = function()
      return { colorscheme = require("rice").style() }
    end,
  },
}
