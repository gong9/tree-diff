/**
 * Detect tow tree what is updated
 * @author imcuttle
 */

const { sync } = require('../visit')
const createCachedChildGetter = require('./core/createCachedChildGetter')
const createStatusManager = require('./core/createStatusManager')
const castArray = require('../visit/castArray')

/**
 *
 * @public
 * @param treeA {T}
 * @param treeB {T}
 * @param opt {{}}
 * @param [opt.limit=Infinity] - The limit of changed node
 * @param [opt.equal=(a, b) => a === b] - The compare strategy of two node
 * @param [opt.path='children']
 *
 * @return {Map}
 */
function detectTreeChanged(treeA, treeB, {
  limit = Infinity,
  equal = (a, b) => a === b,
  path = 'children'
} = {}) {
  if (treeA === treeB || !treeA || !treeB) {
    return
  }

  const sm = createStatusManager({
    limit
  })

  const dp = {}

  // node 的getter后面要记录一下
  const nodeGetter = createCachedChildGetter(treeB, dp, {
    path
  })

  // 节点比较方法
  const equalMethod = (a, b) => {
    if (a === b) return true
    const clonedA = Object.assign({}, a)
    const clonedB = Object.assign({}, b)
    delete clonedA[path]
    delete clonedB[path]

    return equal(clonedA, clonedB)
  }

  const backTracking = fromCtx => {
    sync(
      fromCtx,
      (ctxNode, ctx) => {
        if (fromCtx !== ctxNode && ctxNode.node) {
          if (sm.hasChanged(ctxNode.node)) {
            return ctx.break()
          }
          sm.childChanged(ctxNode.node, ctxNode)
        }
      }, {
        path: 'parentCtx'
      }
    )
  }

  sync(
    treeA,
    null,
    (node, ctx) => {
      let paths = ctx.paths

      let {
        ref,
        broken
      } = nodeGetter(paths)

      ctx.bNodeGet = nodeGetter(paths)
      // Not Found
      if (broken) {
        dp[paths.join('.')] = undefined

        if (!sm.added(node, ctx)) {
          return ctx.break()
        }

        backTracking(ctx)
      } else {
        dp[paths.join('.')] = ref

        // 节点不相等是更新状态
        if (!equalMethod(node, ref)) {
          if (!sm.updated(node, ctx)) {
            return ctx.break()
          }
          backTracking(ctx)
        } else {
          // 节点相等需要
          let srcNodeChildren = castArray(node[path])
          if (!node[path]) {
            srcNodeChildren = []
          }
          let destNodeChildren = castArray(ref[path])
          if (!ref[path]) {
            destNodeChildren = []
          }

          if (srcNodeChildren.length < destNodeChildren.length) {
            if (!sm.hasRemovedChild(node, ctx)) {
              return ctx.break()
            }
            backTracking(ctx)
          }
        }
      }
    },

    {
      order: 'post',
      path
    }
  )



  return sm.map
}

module.exports = detectTreeChanged