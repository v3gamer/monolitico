const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const port = 3000

app.set('view engine', 'ejs')

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

const isAuth = (req, res, next) => {
  if (req.cookies && req.cookies.user) {
    return next();
  }
  res.redirect('/login');
};

app.get('/', (req, res) => {
    //sql
  res.render('index',{title: "Super Plantilla",name: "Victor"})
})

isadmin = (req,res, next) => {
  if (req.cookies && req.cookies.role === "admin"){
      return next();
  }
  res.status(403).send("Acceso denegado: solo admins");
}

isUser = (req, res, next) => {
  if (req.cookies && req.cookies.role === "user") {
    return next();
  }
  res.status(403).send("Acceso denegado: solo usuarios");
};



// Gestion de la visita

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/logout', (req, res) => {
  res.clearCookie("user");
  res.clearCookie("role");
  res.redirect('login');
});

app.post('/login', (req,res) => {
    const { admin, password1, user, password } = req.body;
    console.log(req.body)

   if (admin == "admin" && password1 == "12345"){
    console.log("usuario y contraseña correcta")
    res.cookie("user", admin,) //opciones - js no secure si
    res.cookie("role", "admin");
    res.redirect('admin')

   } else if(user == "user" && password == "1234"){
    res.cookie("user", user,) 
    res.cookie("role", "user");
    res.redirect('profile')
   }
   else {
    res.status(401).redirect("login")
   }
});

app.get('/profile', isAuth, isUser, (req, res) => {
  res.render('profile');
});

app.get('/admin', isAuth, isadmin, (req, res) => {
  res.render('admin');
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
