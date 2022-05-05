const detectTreeChanged = require('./diff')



const demo = detectTreeChanged({
    a: 11,
    
  }, {
    a: 22
  }, {
    equal: (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b)
    }
  }

)

console.log(demo)