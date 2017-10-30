var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');

var Vote = require('../models/vote');
var User = require('../models/user');

router.get('/', ensureUnathenticated, function(req, res){
  res.render('home');
});

router.get('/vote', ensureUncastVote, function(req, res){
  res.render('voteIndex');  
});

router.get('/analytics', function(req, res){
  Vote.getVotes(function(err, votes){
    if (err) throw err;
     res.render('analytics', {votes: votes});
  });
});

router.get('/votes', function(req, res){
  Vote.getVotes(function(err, votes){
    if (err) throw err;
    res.send(votes);
  });
});

router.get('/login', function(req, res){
  res.render('login');
});

router.post('/register', function(req, res){

  var first = req.body.first;
  var last = req.body.last;
  var email = req.body.email;
  var username = req.body.regusername;
  var password = req.body.regpassword;
  var confirmUserPass = req.body.confirmpassword;


  // VALIDATION
   
  req.checkBody('last', '* Last name is required *').notEmpty();
  req.checkBody('email', '* Email is required *').notEmpty();
  req.checkBody('email', '* Email is not valid *').isEmail();
  req.checkBody('regusername', '* User name is required *').notEmpty();
  req.checkBody('regpassword', '* Password is required *').notEmpty();
  req.checkBody('confirmpassword', '* Password does not match *').equals(req.body.regpassword);

  var errors = req.validationErrors();
  
  console.log(errors);

  if (errors) {
    res.render ('home', {
      errors: errors
    });

  } else {
    
    var newUser = new User ({
      first: first,
      last: last,
      username: username,
      email: email,
      password: password,
      voted: false
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    req.flash('success_msg', 'You are now registered, please log in to vote!');
    res.redirect('/login');
  
  }
  
});

router.post('/vote', isLoggedIn, function(req, res){
  var group = req.body.group;
  var comments = req.body.comments;

  // VALIDATION
  req.checkBody('comments', 'You must leave a comment').notEmpty();

  var errors = req.validationErrors();
  

  if (errors) {
    res.render ('vote', {
      errors: errors
    });

  } else {

    var newVote = new Vote ({
      username: req.user.username,
      fullname: req.user.first + " " + req.user.last,
      group: group,
      comments: comments
    });

    

    Vote.castVote(newVote, function(err, vote){
      if (err) throw err;

      User.updateUserVoted(req.user.id, function(err, data){
        req.flash('success_msg', 'Thank you for voting!');
        res.redirect('/analytics');
      });

    });

  }

});

// USER LOGIN PROCEDURES

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) { 
    User.findOne({ 'username' :  username }, 
      function(err, user) {
        if (err)
          return done(err);
        if (!user){
          console.log('User Not Found with username '+ username);
          return done(null, false, 
                req.flash('message', 'User Not found.'));                 
        }
        
        User.comparePassword(password, user.password, function(err, isMatch){
          if(err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: "Incorrect Password"});
          }
        });
      }
    );
}));

router.post('/login', passport.authenticate('login', { successRedirect: '../vote', failureRedirect: '/', failureFlash: true }));

router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success_msg', 'You have logged out successfully');
  res.redirect('/');
});


function isLoggedIn(req, res, next){
  if(req.user){
    next();
  } else {
    req.flash('error_msg', 'You are not logged in.  Log in or register to continue.');
    res.redirect('/login');
  }
}

function ensureUncastVote(req, res, next){
  if(req.user.voted){
    res.redirect('/analytics');
  } else {
    next();
  }
}

function ensureUnathenticated(req, res, next){
  if(req.user){
    res.redirect('/vote')
  } else {
    next();
  }
}

module.exports = router;





