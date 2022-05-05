const castArray = require('./castArray')
const Context = require('./context')

function walkParentCtx(ctx, walk) {
    while (ctx) {
        walk(ctx)
        ctx = ctx.parentCtx
    }
}

/**
 * 获取路径
 * @param {*} srcCtx 
 * @returns 
 */
function getPaths(srcCtx) {
    const paths = []
    walkParentCtx(srcCtx, ctx => {
        if (ctx.parent) {
            paths.unshift(ctx.index)
        }
    })
    return paths
}

/**
 * 获取父亲
 * @param {*} srcCtx 
 * @returns 
 */
function getParents(srcCtx) {
    const parents = []
    walkParentCtx(srcCtx, ctx => {
        if (ctx.parent) {
            parents.unshift(ctx.parent)
        }
    })
    return parents
}


const noop = () => {}

/**
 * 开始遍历
 * @param {*} node 
 * @param {*} preWalk 
 * @param {*} postWalk 
 * @param {*} options 
 */
async function walkTree(node, preWalk, postWalk, options) {
    if (typeof postWalk !== 'function') {
        options = postWalk
        postWalk = noop
    }

    await walkNodeInner(node, preWalk || noop, postWalk || noop, null, options)
}

/**
 * 遍历节点内部
 * @param {*} node 
 * @param {*} preWalk 
 * @param {*} postWalk 
 * @param {*} ctx 
 * @param {*} options 
 * @returns 
 */
async function walkNodeInner(node, preWalk, postWalk, ctx, options = {}) {
    const {
        path = 'children', state
    } = options
    ctx = new Context(
        Object.assign({
                index: 0,
                depth: 1,
                status: null,
                parent: null,
                parentCtx: null
            },
            ctx, {
                node
            }
        ),
        options
    )
    if (!node) {
        return {
            ctx,
            status: null
        }
    }

    if (!ctx.paths) {
        ctx.paths = getPaths(ctx)
    } else {
        ctx.paths = ctx.paths.concat(ctx.index)
    }

    if (!ctx.parents) {
        ctx.parents = getParents(ctx)
    } else {
        ctx.parents = ctx.parents.concat(ctx.parent)
    }

    // ctx.paths = ctx.paths || getPaths(ctx)
    await preWalk(node, ctx)
    if (ctx.status) {
        return {
            ctx,
            status: ctx.status
        }
    }

    const nodes = [].slice.apply(castArray(ctx.children || []))
    let i = 0
    while (nodes.length) {
        const childNode = nodes.shift()
        let result = await walkNodeInner(
            childNode,
            preWalk,
            postWalk, {
                ...ctx,
                index: i,
                parent: node,
                parentCtx: ctx,
                depth: ctx.depth + 1
            },
            options
        )
        if ('break' === result.status) {
            return {
                ctx,
                status: result.status
            }
        }
        // adjust
        i = result.ctx.index
        i++
    }

    await postWalk(node, ctx)
    if (ctx.status) {
        return {
            ctx,
            status: ctx.status
        }
    }
    return {
        ctx,
        status: null
    }
}

/**
 * 同步遍历节点内部
 * @param {*} node 
 * @param {*} preWalk 
 * @param {*} postWalk 
 * @param {*} ctx 
 * @param {*} options 
 * @returns 
 */
function walkNodeInnerSync(node, preWalk, postWalk, ctx, options = {}) {
    const {
        path = 'children', state
    } = options
    ctx = new Context(
        Object.assign({
                index: 0,
                depth: 1,
                status: null,
                parent: null,
                parentCtx: null
            },
            ctx, {
                node
            }
        ),
        options
    )
    if (!node) {
        return {
            ctx,
            status: null
        }
    }

    if (!ctx.paths) {
        ctx.paths = getPaths(ctx)
    } else {
        ctx.paths = ctx.paths.concat(ctx.index)
    }

    if (!ctx.parents) {
        ctx.parents = getParents(ctx)
    } else {
        ctx.parents = ctx.parents.concat(ctx.parent)
    }

    // ctx.paths = ctx.paths || getPaths(ctx)
    preWalk(node, ctx)
    if (ctx.status) {
        return {
            ctx,
            status: ctx.status
        }
    }

    const nodes = [].slice.apply(castArray(ctx.children || []))
    let i = 0
    while (nodes.length) {
        const childNode = nodes.shift()
        let result = walkNodeInnerSync(
            childNode,
            preWalk,
            postWalk, {
                ...ctx,
                index: i,
                parent: node,
                parentCtx: ctx,
                depth: ctx.depth + 1
            },
            options
        )
        if ('break' === result.status) {
            return {
                ctx,
                status: result.status
            }
        }
        // adjust
        i = result.ctx.index
        i++
    }

    postWalk(node, ctx)
    if (ctx.status) {
        return {
            ctx,
            status: ctx.status
        }
    }
    return {
        ctx,
        status: null
    }
}

/**
 * 同步遍历
 * @param {*} node 
 * @param {*} preWalk 
 * @param {*} postWalk 
 * @param {*} options 
 */
function walkTreeSync(node, preWalk, postWalk, options) {
    if (typeof postWalk !== 'function') {
        options = postWalk
        postWalk = noop
    }

    walkNodeInnerSync(node, preWalk || noop, postWalk || noop, null, options)
}

module.exports = walkTree
module.exports.default = walkTree
module.exports.sync = walkTreeSync
module.exports.walkParentCtx = walkParentCtx
module.exports.Context = Context
module.exports.getParents = getParents
module.exports.getPaths = getPaths