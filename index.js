const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const port = 3000

app.set('view engine', 'ejs')

app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    //sql
  res.render('index',{title: "Super Plantilla",name: "Victor"})
})

isadmin = (req,res, next) => {
  if (req.cookies && req.cookies.user){
      return next();
  }
  res.redirect('/login')
}

// gestion de la visita
app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/logout', (req, res) => {
  res.clearCookie("user");
  res.redirect('login');
})
app.post('/login', (req,res) => {
    const {user,password} = req.body;
    //console.log(req.body)

   if (user == "admin" && password == "12345"){
    //console.log("usuario y contraseña correcta")
    res.cookie("user", user,) //opciones - js no secure si
    res.redirect('home')
   }else {
    res.status(401).redirect("login")
   }
});

app.get('/home',isAuth, (req, res) => {
  res.render('home')
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})
