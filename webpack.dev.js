import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { merge } from 'webpack-merge'
import common from './webpack.common.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const config = merge(
  common,
  {
    mode: 'development',
    devServer: {
      static: {
        directory: __dirname
      }
    }
  },
)

export default config
