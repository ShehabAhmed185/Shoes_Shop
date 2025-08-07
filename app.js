const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cusData = require("./models/mySchema");
const productsData = require("./models/productSchema");
const { render } = require('ejs');

const app = express();
const PORT = 3000;
const pathDB = "mongodb://localhost:27017/myDB";

const products = [
  { imgSrc: "shoes1.png", price: 100.99, stars: 5 },
  { imgSrc: "shoes2.png", price: 200.99, stars: 4.5 },
  { imgSrc: "shoes3.png", price: 175.99, stars: 3.5 },
  { imgSrc: "shoes4.png", price: 120.99, stars: 4 },
  { imgSrc: "shoes5.png", price: 150.99, stars: 5 },
  { imgSrc: "shoes6.png", price: 220.99, stars: 4.5 },
  { imgSrc: "shoes.png",  price: 110.99, stars: 3 },
  { imgSrc: "shoes7.png", price: 150.99, stars: 4.5 }
];
const session = require('express-session');

app.use(session({
  secret: 'yourSecretKey', // غيّرها لأي كلمة سر
  resave: false,
  saveUninitialized: true,
}));

async function insertProducts() {
  try {
    await productsData.insertMany(products);
    console.log('Products inserted successfully');
    const data = productsData.find();
    console.log(data)
  } catch (error) {
    console.error('Error inserting products:', error);
  } 
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('login');
});
app.get('/index.ejs', (req, res) => {
  res.render('index',{name:req.session.userName});
});
app.get('/products.ejs', async (req, res) => {
  try {
    const products = await productsData.find().exec(); // Add .exec() to properly execute the query
    // const customerData = await cusData.find().exec(); // Add .exec() to properly execute the query
    // products.forEach(i =>{
    //   console.log(i)
    // });
    res.render('products', { result: products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
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


app.get("/cart/add/:productId", async (req, res) => {
  try{
    console.log("Add to cart")
  //  const cart = req.session.cart || [];
//  return res.render('cart')
  const id =req.params.productId
  const proData = await productsData.findById(id);
  console.log(`id is ${id}`)
  const price = proData.price;
  req.session.productID = id;
  res.render('cart',{price});
  }catch(err){
    console.log(err)
  }

})





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
    let userID=null,name =null
   await allData.forEach(element =>{
        if(element.email == req.body.email  && element.password == req.body.password){
          count++;
         userID= element._id;
         name =element.name
        }
    });
    
  if (userID&&name) {
    req.session.userId= userID;
    req.session.userName= name;
  }
    if(count == 0)
        return res.send("WRONG USER NAME OR PASSWORD")
      else{
        // req.session.quantity = 0;
        return res.render('index',{name})
      }
  }catch (err) {
    console.error(" Error:", err);
    res.status(500).send("Something went wrong!");
  }

})



app.post("/submit-order",async (req, res) => {
  try{
  const { quantity, location,phone } = req.body;
  const cart = req.session.cart || [];
  const proData = await productsData.findById(req.session.productID);
  const pricePerShoe = proData.price;
  const total = quantity * pricePerShoe;

  if (!req.session.orderTime) {
    req.session.orderTime = new Date().toLocaleString(); 
  }
  
  const orderInfo = {
    quantity: parseInt(quantity),
    location,
    phone,
    total,
    cart,
    date: req.session.orderTime
  };

  res.render("invoice", { order: orderInfo });
}catch(err){
  console.log(err)
}
});





mongoose.connect(pathDB)
  .then(() => {
    console.log("Connected to DB",mongoose.modelNames());
    app.listen(PORT, () => {
      console.log(`SERVER IS CONNECTED WITH PORT ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
  });
