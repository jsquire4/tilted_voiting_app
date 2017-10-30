var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');

var voteSchema = new Schema({

  username: {
    type: String
  },

  fullname: {
    type: String
  },

  group: {
    type: String
  },

  comments: {
    type: String
  }
});

var Vote = module.exports = mongoose.model('Vote', voteSchema);

function russianNameGenerator(){
  var fakeNames = JSON.parse(fs.readFileSync("./russianNames.json"));
  var firstnames = fakeNames[0].firstnames;
  var lastnames = fakeNames[1].lastnames;
  var firstname = firstnames[Math.floor(Math.random()*firstnames.length)].Name;
  var lastname = lastnames[Math.floor(Math.random()*lastnames.length)].Name;
  var name = {firstname: firstname, lastname: lastname}
  return name;
}

function userNameGenerator(russianName){
  var username = russianName.lastname[0] + russianName.firstname;
  return username;
}

function commentGenerator(){
  var fakedComments = JSON.parse(fs.readFileSync("./fakedcomments.json"));
  var comment = fakedComments[Math.floor(Math.random()*fakedComments.length)].Comment;
  return comment;
}

function fakeVote(callback){

  var russianName = russianNameGenerator();
  var fakeUser = userNameGenerator(russianName);
  var fakeComment = commentGenerator();

  fakeVote = new Vote ({
    username: fakeUser,
    fullname: russianName.firstname + " " + russianName.lastname,
    group: "Priests",
    comments: fakeComment,
  });

  fakeVote.save(callback);
}

module.exports.castVote = function(vote, callback){
  fakeVote(function(err, data){
    if (err) throw err;
    vote.save(callback);
  });
}

module.exports.getVotes = function(callback){
  Vote.find({}, function(err, data){
    if (err) throw err;
    callback(null, data);
  });
}