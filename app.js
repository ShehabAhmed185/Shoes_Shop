const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cusData = require("./models/mySchema");
const productsData = require("./models/productSchema");
const userReview = require("./models/userReviewSchema");
const profitsData = require("./models/calcProfitsSchema");
const session = require('express-session');
const bcrypt = require('bcrypt');
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
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  req.session.count = 0;
  if (!req.session.productIDsToFavourits) req.session.productIDsToFavourits = [];
  if (!req.session.cart) req.session.cart = [];
  res.render('login');
});

app.get('/index.ejs', (req, res) => {
  res.render('index', { name: req.session.userName });
});

app.get('/products.ejs', async (req, res) => {
  try {
    const products = await productsData.find().exec();
    res.render('products', { result: products, x: (req.session.count || 0) });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.get('/about.ejs', (req, res) => res.render('about'));
app.get('/services.ejs', (req, res) => res.render('services'));
app.get('/login.ejs', (req, res) => res.render('login'));
app.get('/registration.ejs', (req, res) => res.render('registration'));

app.get("/add_to_favourite/:productId", async (req, res) => {
  try {
    if (!req.session.productIDsToFavourits) req.session.productIDsToFavourits = [];
    const productID = req.params.productId;
    if (!req.session.productIDsToFavourits.includes(productID)) {
      req.session.productIDsToFavourits.push(productID);
    }
    const products = await productsData.find().exec();
    res.render('products', { result: products, x: (req.session.count || 0) });
  } catch (err) {
    res.status(500).send("Error adding to favourites");
  }
});

app.get("/favourites", async (req, res) => {
try {
    if (!req.session.productIDsToFavourits || req.session.productIDsToFavourits.length === 0) {
    return res.render("error", { message: "No favourites exist", returnUrl: "Products.ejs" });
  }
  const productList = [];
  for (let id of req.session.productIDsToFavourits) {
    const prod = await productsData.findById(id);
    if (prod) productList.push(prod);
  }
  res.render('favourites', { result: productList, x: (req.session.count || 0) });

} catch (error) {
    console.log(error)
}
});

app.get("/Destroy_Favourites", async (req, res) => {
  req.session.productIDsToFavourits = [];
  const products = await productsData.find().exec();
  res.render('products', { result: products, pID: req.session.userId, x: (req.session.count || 0) });
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
      req.session.cart.push({ productID: id, name: proData.name, price: proData.price, quantity: 1 });
    }
    req.session.count = (req.session.count || 0) + 1;
    const products = await productsData.find().exec();
    res.render('products', { result: products, x: req.session.count });
  } catch {
    res.status(500).send("Error adding to cart");
  }
});

app.get('/build_cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('cart', { sess: cart });
});

app.get("/Destroy_Cart", async (req, res) => {
  req.session.cart = [];
  req.session.count = 0;
  const products = await productsData.find().exec();
  res.render('products', { result: products, x: (req.session.count || 0) });
});

app.post('/register', async (req, res) => {
  if (req.body.password !== req.body.confirm_password) return res.send("Passwords do not match");
  try {
    const { name, email, password } = req.body;
    const allData = await cusData.find();
    if (allData.some(user => user.email === email))  return res.render("error", { message:"THIS EMAIL IS ALREADY EXIST", returnUrl: "registration.ejs" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new cusData({ name, email, password: hashedPassword }).save();
    res.redirect("/");
  } catch {
    res.status(500).send("Something went wrong!");
  }
});

app.post('/login', async (req, res) => {
  try {
    if(req.body.email=="Admin1@gmail.com" && req.body.password == "Admin1"){
       req.session.isAdmin = true;
      return res.render('indexAdmin', { name: "Admin" });
    }
    const allData = await cusData.find();
    for (const element of allData) {
      const isMatch = await bcrypt.compare(req.body.password, element.password);
      if (element.email === req.body.email && isMatch) {
        req.session.userId = element._id;
        req.session.userName = element.name;
        return res.render('index', { name: element.name });
      }
    }
     return res.render("error", { message:"WRONG USER NAME OR PASSWORD", returnUrl: "Login.ejs" });
  } catch {
    res.status(500).send("Something went wrong!");
  }
});



app.post("/submit-order", async (req, res) => {
  try {
    const { productIDs, quantities, location, phone } = req.body;
    const orderItems = productIDs.map((id, index) => ({ 
      productID: id, 
      quantity: parseInt(quantities[index], 10) 
    }));

    let total = 0;
    const items = [];
    const nameOfPro = [];
    const userQuan = [];
    const priceOfPro = [];

    for (let item of orderItems) {
      const proData = await productsData.findById(item.productID);
      const availableQuantity = proData.quantity;

      if (availableQuantity < item.quantity) {
        const message = availableQuantity === 0 
          ? "Sorry, this product is not available" 
          : `Sorry, there are only ${availableQuantity} items available`;
        return res.render("error", { message, returnUrl: "Products.ejs" });
      }

      await productsData.findByIdAndUpdate(item.productID, { 
        $inc: { quantity: -item.quantity } 
      });

      items.push({
        name: proData.name,
        productID: item.productID,
        pricePerShoe: proData.price,
        quantitySold: item.quantity
      });

      nameOfPro.push(proData.name);
      priceOfPro.push(proData.price);
      userQuan.push(item.quantity);
      total += item.quantity * proData.price;
    }

    const userID = req.session.userId;
    calcSaveProfits(items,total,userID)
    const orderInfo = { 
      nameOfPro, 
      userQuan, 
      priceOfPro, 
      location, 
      phone, 
      total, 
      date: new Date().toLocaleString() 
    };

    req.session.cart = [];
    req.session.count = 0;

    res.render("invoice", { order: orderInfo });
  } catch (error) {
    console.error("Order processing error:", error);
    res.status(500).send("Order processing error");
  }
});

async function calcSaveProfits(items,total,uID){
  try {

    const profitRecord = new profitsData({
      items,
      totalPrice: total,
      userID: uID
    });
    await profitRecord.save();
    console.log("Profits saved in DB")
  } catch (error) {
    console.log(error)
  }
}

app.get("/indexAdmin",(req,res)=> {return res.render('indexAdmin', { name: "Admin" });});

app.get("/review.ejs", async (req, res) => {
  const allReviews = await userReview.find().sort({ _id: -1 });
  res.render("review", { reviews: allReviews });
});

app.post("/userReview", async (req, res) => {
  try {
    const id = req.session.userId;
    const customerData = await cusData.findById(id);
    await new userReview({ userID: id, userName: customerData.name, ...req.body }).save();
    res.redirect("/review.ejs");
  } catch {
    res.status(500).send("Error saving review");
  }
});


// Admin Apis

app.get("/displaySolds", async (req, res) => {
  try {
    const allProfits = await profitsData.find().exec();
    res.render("display_solds", { profits: allProfits });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching data");
  }
});

app.post("/addProduct", async(req,res)=>{
  try {
      return res.render("add_product")
  } catch (error) {
    console.log(error)
  }
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/saveProduct', async (req, res) => {
  try {
    let products = req.body.products;
    if (typeof products === 'string') products = JSON.parse(products);
    await productsData.insertMany(products);
    return res.render('indexAdmin', { name: 'Admin' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});




mongoose.connect(pathDB)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER IS CONNECTED WITH PORT ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log("MongoDB Connection Error:", err));
