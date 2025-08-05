const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cusData = require("./models/mySchema");

const app = express();
const PORT = 3000;
const pathDB = "mongodb://localhost:27017/MyData";

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('login');
});
app.get('/index.ejs', (req, res) => {
  res.render('index');
});
app.get('/products.ejs', (req, res) => {
  res.render('products');
});
app.get('/about.ejs', (req, res) => {
  res.render('about');
});
app.get('/review.ejs', (req, res) => {
  res.render('review');
});

app.get('/services.ejs', (req, res) => {
  res.render('services');
});
app.get('/login.ejs', (req, res) => {
  res.render('login');
});
app.get('/registration.ejs', (req, res) => {
  res.render('registration');
});


app.post('/register', async (req, res) => {
    if(req.body.password != req.body.confirm_password){
      res.send("Passwords do not match")
    }
  try {
    let count = 0;
    const allData = await cusData.find();
    allData.forEach(element => {
      if(req.body.email == element.email){
        count++
       return res.send("THIS EMAIL IS ALREADY EXIST")
      }
      if(req.body.password == element.password){
        count++
       return res.send("THIS PASSWORD IS ALREADY EXIST")
      }
    })
   
    console.log("Data is received");
    console.log(req.body);
    if(count == 0 ){
      const article = new cusData(req.body);
      await article.save();
      res.redirect("/");
    }
  } catch (err) {
    console.error(" Error:", err);
    res.status(500).send("Something went wrong!");
  }
});


app.post('/login', async (req, res) => {

  try{
    const allData = await cusData.find();
    let count = 0;
   await allData.forEach(element =>{
        if(element.name == req.body.name && element.password == req.body.password){
          count++
        }
    })
    console.log(allData)
    if(count == 0)
        return res.send("WRONG USER NAME OR PASSWORD")
      else
        return res.redirect('index')
  }catch (err) {
    console.error(" Error:", err);
    res.status(500).send("Something went wrong!");
  }



})




mongoose.connect("mongodb://localhost:27017/myDB")
  .then(() => {
    console.log("Connected to DB",mongoose.modelNames());
    app.listen(PORT, () => {
      console.log(`✅ SERVER IS CONNECTED WITH PORT ${PORT}`);
      console.log(`➡️ http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });
