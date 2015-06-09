var express = require('express'),
    bodyParser = require('body-parser'),
    db = require("./models"),
    session = require("express-session"),
    pg = require("pg"),
    app = express();

var app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'super secret',
  resave: false,
  saveUninitialized: true
}));

app.use("/", function (req, res, next) {

  req.login = function (user) {
    //set the value on session.userId
    req.session.userId = user.id;
  };

  req.currentUser = function () {
    return db.User.
      find({
        where: {
          id: req.session.userId
       }
      }).
      then(function (user) {
        req.user = user;
        return user;
      })
  };

  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  }
  //tells app we're done and to move on to next request
  next(); 
});

app.get("/users/signup", function (req, res) {
  res.render("users/signup");
});

// where the user submits the sign-up form
app.post("/signup", function (req, res) {

  // grab the user from the params
  var user = req.body.user;

  // create the new user
  db.User
    .createSecure(user.email, user.password)
    .then(function(){
        res.redirect("users/login");
      });
});

app.get("/users/login", function (req, res) {
  res.render("users/login");
});

app.post("/login", function (req, res) {
  var user = req.body.user;

  db.User
    .authenticate(user.email, user.password)  
    .then(function (user) {
          req.login(user);
          res.redirect("/profile");
    });
});

app.get('/profile', function (req, res) {
  req.currentUser()
      .then(function (user) {
        res.render("users/profile", {user: user});
      });
});

app.get('/articles', function(req,res) {
    db.Article.findAll(
        {include: [db.Author]})
        .then(function(articles) {
            res.render("articles/index", {articlesList: articles});
    });
});

app.get('/articles/new', function(req,res) {
  db.Author.all().then(function(author) {
  	  res.render('articles/new', {ejsAuthors: author});
  	});
});

app.post('/articles', function(req,res) {
	db.Article.create(req.body.article)
		.then(function(article) {
			res.redirect('/articles');
		});
});

app.get('/articles/:id', function(req, res) {
   db.Article.find({where: {id: req.params.id}, include: db.Author} )
    .then(function(article) {
      res.render('articles/article', {articleToDisplay: article});
    });
})

// Fill in these author routes!
app.get('/authors', function(req, res) {
	db.Author.all()
        .then(function(authors) {
            res.render("authors/index", {ejsAuthors: authors});
    });
});

app.get('/authors/new', function(req, res) {
	db.Article.all().then(function(articles) {
		res.render('authors/new', {articlesList: articles})
	})
});

app.post('/authors', function(req, res) {
	db.Author.create(req.body.author)
		.then(function(author) {
			res.redirect('authors');
		});
});

app.get('/authors/:id', function(req, res) {
	db.Author.find({where: {id: req.params.id}, include: db.Article})
	  .then(function(author) {
	  	res.render('authors/author', {ejsAuthor: author});
	  });
});

app.get('/', function(req,res) {
  res.render('site/index');
});

app.get('/about', function(req,res) {
  res.render('site/about');
});

app.get('/contact', function(req,res) {
  res.render('site/contact');
});



app.listen(3000, function() {
	var msg = "* Listening on Port 3000 *";

	// Just for fun... what's going on in this code?
	/*
	 * When the server starts listening, it displays:
	 *
	 * 	**************************
	 *	* Listening on Port 3000 *
	 *	**************************
	 *
	*/
	console.log(Array(msg.length + 1).join("*"));
	console.log(msg);
	console.log(Array(msg.length + 1).join("*"));
});
