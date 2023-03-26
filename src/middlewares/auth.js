const isLoggedIn = (req,res, next) => {
    
    if(req.user) {
        next()
    } else {
        // return res.redirect('/login')
        next()
    }
}

module.exports = isLoggedIn;