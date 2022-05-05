const detectTreeChanged = require('./diff')



const demo = detectTreeChanged({
        a: 11,
        b: 222,
        children: [{
            c: 111
        }]
    }, {
        a: 22
    }, {
        equal: (a, b) => {
            return JSON.stringify(a) === JSON.stringify(b)
        }
    }

)

console.log(demo)