const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cusData = require("./models/mySchema");
const productsData = require("./models/productSchema");
const { render } = require('ejs');
const e = require('express');
session = require('express-session');

const app = express();
const PORT = 3000;
const pathDB = "mongodb://localhost:27017/myDB";

const products = [
  { imgSrc: "shoes1.png", price: 100.99, stars: 5, name: "Nike Air Max", quantity: 10 },
  { imgSrc: "shoes2.png", price: 89.50, stars: 4, name: "Adidas Ultraboost", quantity: 8 },
  { imgSrc: "shoes3.png", price: 120.00, stars: 5, name: "Puma RS-X", quantity: 12 },
  { imgSrc: "shoes4.png", price: 75.25, stars: 3, name: "Reebok Classic", quantity: 15 },
  { imgSrc: "shoes5.png", price: 95.75, stars: 4, name: "Asics Gel-Kayano", quantity: 9 },
  { imgSrc: "shoes6.png", price: 110.49, stars: 5, name: "New Balance 574", quantity: 11 },
  { imgSrc: "shoes7.png", price: 85.00, stars: 4, name: "Converse Chuck Taylor", quantity: 14 },
  { imgSrc: "shoes8.png", price: 130.00, stars: 5, name: "Jordan Retro 1", quantity: 6 }
];


app.use(session({
  secret: 'yourSecretKey',  
  resave: false,
  saveUninitialized: true,
}));

async function insertProducts() {
  try {
    await productsData.insertMany(products);
    console.log('Products inserted successfully');
    const data = await productsData.find();
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
  req.session.count=0;
    // insertProducts();
  res.render('login');
});
app.get('/index.ejs', (req, res) => {
  res.render('index',{name:req.session.userName});
});
app.get('/products.ejs', async (req, res) => {
  try {
    const products = await productsData.find().exec(); 
    res.render('products', { result: products ,pID:0,x:0});
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
  try {
    const id = req.params.productId;
    const proData = await productsData.findById(id);

    if (!req.session.cart) req.session.cart = [];

    const existingProduct = req.session.cart.find(p => p.productID === id);
    if (existingProduct) {
      existingProduct.quantity += 1; 
    } else {
      req.session.cart.push({
        productID: id,
        name: proData.name,
        price: proData.price,
        quantity: 1
      });
    }

    req.session.count = (req.session.count || 0) + 1;

    const products = await productsData.find().exec();
    res.render('products', { result: products, pID: id, x: req.session.count });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding to cart");
  }
});

app.get('/build_cart',async (req,res)=>{
try{
  const cart = req.session.cart || [];
  // const id =req.session.id;
  return  res.render('cart',{sess:cart});     
}catch(err){
  console.log(err)
}
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
   const { productIDs, quantities, location, phone } = req.body;

    const orderItems = productIDs.map((id, index) => {
      return {
        productID: id,
        quantity: parseInt(quantities[index], 10)
      };
    });
    let total=0;
    let nameOfPro=[]
    let userQuan=[]
    let priceOfPro=[]
    for (let i = 0; i < orderItems.length; i++) {
      const proData = await productsData.findById(orderItems[i].productID);
      const pricePerShoe = proData.price;
      nameOfPro.push(proData.name)
      priceOfPro.push(proData.price)
       total +=orderItems[i].quantity * pricePerShoe;
      const availableQuantity = proData.quantity;
      userQuan.push(orderItems[i].quantity)
      if (availableQuantity < orderItems[i].quantity) {
         orderItems[i].quantity = availableQuantity;
      return res.send(`Sorry There are ${availableQuantity} Shoe /s Only`)
      }else{
        const updatedProduct = await productsData.findByIdAndUpdate(
              orderItems[i].productID,
              { $inc: { quantity: -(orderItems[i].quantity) } }, // Decreases stock
              { new: true }
            );
            if(!updatedProduct)
              res.send("DB IS NOT UPDATED");

              console.log(orderItems[i].productID)
              
            }
      }//end of for lloop

        if (!req.session.orderTime) 
            req.session.orderTime = new Date().toLocaleString(); 
        
        const orderInfo = {
         nameOfPro,
         userQuan,
         priceOfPro,
          location,
          phone,
          total,
          date: req.session.orderTime
        }
      req.session.destroy(err => {
              if (err) console.log("Error destroying session:", err);
            });
          res.render("invoice", { order: orderInfo });
  
  }catch(err){
    console.log(err);
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
