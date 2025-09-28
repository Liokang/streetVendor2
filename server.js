const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");



mongoose.connect("mongodb+srv://johnfas1234_db_user:PbIXKq4T9oKMSxbd@cluster0.i6ocpvn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});


/* Schemas */
const cartSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  image: String,
});

const CartItem = mongoose.model("CartItem", cartSchema);

const userCartSchema = new mongoose.Schema({
  product: String,
  quantity: Number,
  price: Number,
});

const UserCartItem = mongoose.model("UserCartItem", userCartSchema);

const userSchema = new mongoose.Schema({
  name: String,
  phoneNumber: Number,
  email: String,
  address: String,
  password: String,
  cart: { type: [UserCartItem.schema], default: [] },
});

const Users = mongoose.model("Users", userSchema);

const orderSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  address: String,
  longitude: String,
  latitude: String,
  products: [{ product: String, quantity: Number, price: Number }],
});

const Order = mongoose.model("Order", orderSchema);

const vendorSchema = new mongoose.Schema({
  name: String,
  image: String,
  phoneNumber: String,
  password: String,
  cart: { type: [CartItem.schema], default: [] },
  orders: { type: [Order.schema], default: [] },
});

const Vendors = mongoose.model("Vendors", vendorSchema);

/* App Config */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));

let isloggedIn = false;
let details = {};

/* Helper: Validate ObjectId */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* Routes */
app.get("/", (req, res) => {
  res.render("index.ejs", { isloggedIn });
});

app.get("/login", (req, res) => {
  res.render("login/login.ejs", { isloggedIn });
});

app.get("/logout", (req, res) => {
  isloggedIn = false;
  details = {};
  res.redirect("/");
});

app.get("/loginuser", (req, res) => {
  res.render("login/loginuser.ejs", { isloggedIn });
});

app.post("/loginuser", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.body.email });
    if (user && user.password === req.body.password) {
      isloggedIn = true;
      details = user;
      console.log("User matched");
    } else {
      console.log("User not matched");
    }
  } catch (err) {
    console.log(err);
  }
  res.redirect("/secretUser");
});

app.get("/loginvendor", (req, res) => {
  res.render("login/loginvendor.ejs", { isloggedIn });
});

app.post("/loginvendor", async (req, res) => {
  try {
    const vendor = await Vendors.findOne({ phoneNumber: req.body.phoneno });
    if (vendor && vendor.password === req.body.password) {
      isloggedIn = true;
      details = vendor;
      console.log("Vendor matched");
    } else {
      console.log("Vendor not matched");
    }
  } catch (err) {
    console.log(err);
  }
  res.redirect("/secretVendor");
});

app.get("/secretVendor", (req, res) => {
  res.render("secretVendor.ejs", { isloggedIn });
});

app.get("/signup", (req, res) => {
  res.render("signUp/register.ejs", { isloggedIn });
});

app.get("/signupuser", (req, res) => {
  res.render("signUp/signupuser.ejs", { isloggedIn });
});

app.post("/signupuser", async (req, res) => {
  try {
    const user = new Users({
      name: req.body.name,
      phoneNumber: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      password: req.body.password,
    });
    await user.save();
    console.log("User signed up");
  } catch (err) {
    console.error(err);
  }
  res.redirect("/");
});

app.get("/signupvendor", (req, res) => {
  res.render("signUp/signupvendor.ejs", { isloggedIn });
});

app.post("/signupvendor", async (req, res) => {
  try {
    const vendor = new Vendors({
      name: req.body.name,
      phoneNumber: req.body.phoneno,
      image: req.body.image,
      password: req.body.password,
    });
    await vendor.save();
    console.log("Vendor signed up");
  } catch (err) {
    console.error(err);
  }
  res.redirect("/");
});

app.get("/secretUser", (req, res) => {
  res.render("secretUser.ejs", { isloggedIn });
});

/* Vendor Store Routes */
app.get("/vendorstore", async (req, res) => {
  if (!details._id || !isValidId(details._id)) return res.status(400).send("Invalid vendor ID");
  const vendor = await Vendors.findById(details._id);
  res.render("vendorstore.ejs", { isloggedIn, list: vendor });
});

app.post("/vendorstore", async (req, res) => {
  const { name: product, quantity, image } = req.body;
  if (!details._id || !isValidId(details._id)) return res.status(400).send("Invalid vendor ID");
  const vendor = await Vendors.findById(details._id);
  vendor.cart.push({ product, quantity, image });
  await vendor.save();
  res.redirect("/vendorstore");
});

/* Edit Profiles */
app.get("/editprofilevendor", (req, res) => {
  res.render("secretV/editvendorprofile.ejs", { isloggedIn, details });
});

app.post("/editprofilevendor", async (req, res) => {
  const { name, image, phone, password } = req.body;
  if (!details._id || !isValidId(details._id)) return res.status(400).send("Invalid vendor ID");
  const updatedVendor = await Vendors.findByIdAndUpdate(
    details._id,
    { name, image, phoneNumber: phone, password },
    { new: true }
  );
  details = updatedVendor;
  res.redirect("/secretVendor");
});

app.get("/edituserprofile", (req, res) => {
  res.render("secretU/edituserprofile.ejs", { isloggedIn, details });
});

app.post("/edituserprofile", async (req, res) => {
  const { name, phone, email, address, password } = req.body;
  if (!details._id || !isValidId(details._id)) return res.status(400).send("Invalid user ID");
  const updatedUser = await Users.findByIdAndUpdate(
    details._id,
    { name, phoneNumber: phone, email, address, password },
    { new: true }
  );
  details = updatedUser;
  res.redirect("/secretUser");
});

/* Order Routes */
app.get("/ordernow", async (req, res) => {
  const listOfVendors = await Vendors.find({});
  res.render("secretU/ordernow.ejs", { isloggedIn, details, listOfVendors });
});

app.get("/ordernow/vendor/:id", async (req, res) => {
  const productId = req.params.id;
  if (!isValidId(productId)) return res.status(400).send("Invalid vendor ID");
  const vendor = await Vendors.findById(productId);
  res.render("secretU/usercart.ejs", { isloggedIn, final: vendor.cart, details, productId });
});

/* Checkout Routes */
app.get("/checkout/:id", async function(req, res){
  const productId = req.params.id;
  if (!isValidId(productId)) return res.status(400).send("Invalid vendor ID");

  const list = await Vendors.findById(productId);

  const tempUserCart = (details.cart && Array.isArray(details.cart)) ? details.cart : [];

  res.render("secretU/checkout.ejs", { 
    isloggedIn, 
    tempUserCart, 
    list 
  });
});

app.post("/checkout/:id", async (req, res) => {
  const vendorId = req.params.id;
  if (!isValidId(vendorId)) return res.status(400).send("Invalid vendor ID");

  const { longitude, latitude } = req.body;
  const newOrder = new Order({
    name: details.name,
    phoneNumber: details.phoneNumber,
    address: details.address,
    longitude,
    latitude,
    products: details.cart || [],
  });

  const savedOrder = await newOrder.save();
  await Vendors.findByIdAndUpdate(vendorId, { $push: { orders: savedOrder } }, { new: true });
  await Users.updateOne({ _id: details._id }, { $unset: { cart: 1 } });
  details.cart = [];
  res.redirect("/");
});

app.post("/ordernow/vendor/:id", async function(req, res){
  const { product, quantity, price } = req.body;
  const userId = details._id;

  const user = await Users.findById(userId);

  for (let i = 0; i < product.length; i++) {
    if (parseInt(quantity[i]) > 0) {
      user.cart.push({
        product: product[i],
        quantity: parseInt(quantity[i]),
        price: parseFloat(price[i]),
      });
    }
  }

  await user.save();
  details = user;

  res.redirect("/ordernow/vendor/" + req.params.id);
});

/* Track Order Route */
app.get("/trackyourorder/:id", async (req, res) => {
  const orderId = req.params.id;
  if (!isValidId(orderId)) return res.status(400).send("Invalid order ID");

  const vendor = await Vendors.findOne({ "orders._id": orderId }, { "orders.$": 1 });
  if (!vendor || vendor.orders.length === 0) return res.status(404).send("Order not found");
  const order = vendor.orders[0];
  res.render("secretV/trackyourorder.ejs", { order });
});

/* Delete Vendor Cart Item */
app.post("/deletevendorcart/:id", async (req, res) => {
  const cartId = req.params.id;
  if (!isValidId(cartId)) return res.status(400).send("Invalid cart item ID");

  await Vendors.updateOne({ _id: details._id }, { $pull: { cart: { _id: cartId } } });
  res.redirect("/vendorstore");
});

/* Delete Vendor Order */
app.post("/deleteorder/:id", async (req, res) => {
  const orderId = req.params.id;
  if (!isValidId(orderId)) return res.status(400).send("Invalid order ID");

  await Vendors.updateOne({ _id: details._id }, { $pull: { orders: { _id: orderId } } });
  details = await Vendors.findById(details._id);
  res.redirect("/orderlist");
});

/* Order List */
app.get("/orderlist", (req, res) => {
  res.render("secretV/orderlist.ejs", { isloggedIn, tempVendorDetails: details.orders, details });
});

/* Server Start */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});