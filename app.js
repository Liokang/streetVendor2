const express=require("express");
const app=express();
const path = require('path');
const ejs=require("ejs");
const ejsMate=require("ejs-mate");
const bodyParser=require("body-parser");
const mongoose = require('mongoose');



mongoose.connect('mongodb://127.0.0.1:27017/streetvendor',{useNewUrlParser:true});


const cartSchema = new mongoose.Schema({
    product: String,
    quantity: Number,
    image:String

});


const CartItem= mongoose.model('CartItem', cartSchema);


const userCartSchema=new mongoose.Schema({
    product: String,
    quantity: Number,
    price:Number
});

const UserCartItem=mongoose.model('UserCartItem', userCartSchema);

const userSchema = new mongoose.Schema({

    name: String,
    phoneNumber: Number,
    email: String,
    address:String,
    password: String,
    cart: {
    type: [UserCartItem.schema],
    default: [],
  },
});

const Users = mongoose.model("Users", userSchema);


const orderSchema = new mongoose.Schema({
  name: String,
  phoneNumber:  String,
  address: String,
  longitude:String,
  latitude:String,
  products: [
    {product: String,
      quantity: Number,
      price:Number
    }]
});

const Order = mongoose.model('Order', orderSchema);

const vendorSchema = new mongoose.Schema({
  name: String,
  image:String,
  phoneNumber: String,
  password: String,
  cart: {
    type: [CartItem.schema],
    default: [],
  },
  orders:{
  type: [Order.schema],
  default: [],
},

});

const Vendors = mongoose.model("Vendors", vendorSchema);



app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

var isloggedIn=false;
let details={};

app.get("/",function(req,res){
  res.render("index.ejs",{isloggedIn:isloggedIn});
});


app.get("/login",function(req,res){
  res.render("login/login.ejs",{isloggedIn:isloggedIn});
});


app.get("/logout",function(req,res){
  isloggedIn=false;
  details={};
  res.redirect("/");
});
app.get("/loginuser",function(req,res){
  res.render("login/loginuser.ejs",{isloggedIn:isloggedIn});
});

app.post("/loginuser",function(req,res){
Users.findOne({email:req.body.email})
.then((docs)=>{
     console.log("Result :",docs);
     if(docs.password==req.body.password){
       isloggedIn=true;
       details=docs;
       console.log("matched");
     }
     else{
       console.log("non matched");
     }
 })
 .catch((err)=>{
     console.log(err);
 })

 res.redirect("/secretUser");
});

app.get("/loginvendor",function(req,res){
  res.render("login/loginvendor.ejs",{isloggedIn:isloggedIn});
});

app.post("/loginvendor",async function(req,res){
await Vendors.findOne({phoneNumber:req.body.phoneno})
  .then((docs)=>{
       console.log("Result :",docs);
       if(docs.password==req.body.password){
          isloggedIn=true;
          details=docs;
         console.log("matched");
       }
       else{
         console.log("non matched");
       }
   })
   .catch((err)=>{
       console.log(err);
   })
   res.redirect("/secretVendor");
});

app.get("/secretVendor",function(req,res){
  res.render("secretVendor.ejs",{isloggedIn:isloggedIn})
});


app.get("/signup",function(req,res){
  res.render("signUp/register.ejs",{isloggedIn:isloggedIn});
});

app.get("/signupuser",function(req,res){
  res.render("signUp/signupuser.ejs",{isloggedIn:isloggedIn});
});

app.post("/signupuser",async function(req,res){
  const user=new Users({
    name:req.body.name,
    phoneNumber:req.body.phone,
    email:req.body.email,
    address:req.body.address,
    password:req.body.password
  });

  await user
      .save()
      .then(() => console.log(" inserted by user in item collection of db"))
      .catch((err) => console.error(err));

  res.redirect('/');
});


app.get("/signupvendor",function(req,res){
  res.render("signUp/signupvendor.ejs",{isloggedIn:isloggedIn});
});

app.post("/signupvendor",async function(req,res){

  const vendor=new Vendors({
    name:req.body.name,
    phoneNumber:req.body.phoneno,
    image:req.body.image,
    password:req.body.password
  });

  await vendor
      .save()
      .then(() => console.log(" inserted by user in item collection of db"))
      .catch((err) => console.error(err));

  res.redirect("/");
});


app.get("/secretUser",function(req,res){
  res.render("secretUser.ejs",{isloggedIn:isloggedIn})
});

app.get("/vendorstore",async function(req,res){
  const list= await Vendors.findById(details._id);

  res.render("vendorstore.ejs",{isloggedIn:isloggedIn,list:list});
});

app.post("/vendorstore",async  function(req,res){

  const userId=details._id;
  const product=req.body.name1;
  const quantity=req.body.name2;
  const image=req.body.name3;

    // Find the user by ID
    const user = await Vendors.findById(userId);
      // if (!user) {
    //   return res.status(404).json({ success: false, error: 'User not found.' });
    // }
    // Initialize the cart array if it's undefined

    // Create a new cart item
    const newItem = { product, quantity,image };
    console.log(newItem);
    // Add the cart item to the user's cart
    user.cart.push(newItem);

  // Save the user
    await user.save();
  res.redirect("/vendorstore");

});

app.get("/editprofilevendor",function(req,res){
  console.log(details);
  res.render("secretV/editvendorprofile.ejs",{isloggedIn:isloggedIn,details:details});
});

app.post('/editprofilevendor', function(req, res) {
  const userId=details._id;
  Vendors.findByIdAndUpdate(userId, {  name: req.body.name,image:req.body.image, phoneNumber:req.body.phone,  password:req.body.password  }, { new: true })
  .then((updatedUser) => {
    details=updatedUser;
    console.log('Updated user:', updatedUser);
  })
  .catch((error) => {
    console.error('Error updating user:', error);
  });
  res.redirect("/secretVendor");
});

app.get("/edituserprofile",function(req,res){
  res.render("secretU/edituserprofile.ejs",{isloggedIn:isloggedIn,details:details});
});

app.post("/edituserprofile",function(req,res){
  const userId=details._id;
  Users.findByIdAndUpdate(userId, { name: req.body.name, phoneNumber:req.body.phone,  email:req.body.email, address:req.body.address, password:req.body.password}, { new: true })
  .then((updatedUser) => {
    details=updatedUser;
    console.log('Updated user:', updatedUser);
  })
  .catch((error) => {
    console.error('Error updating user:', error);
  });
  res.redirect("/secretUser");
});

app.get("/ordernow",async function(req,res){
  const listOfVendors = await Vendors.find({});
  console.log(listOfVendors[0]);
  res.render("secretU/ordernow.ejs",{isloggedIn:isloggedIn,details:details,listOfVendors:listOfVendors});
});

app.get("/ordernow/vendor/:id",async function(req,res){

  const productId = req.params.id;
  const pro = await Vendors.findById(productId);
  const final=pro.cart;

  res.render("secretU/usercart.ejs",{isloggedIn:isloggedIn,final:final,details:details,productId:productId});

});

app.post("/ordernow/vendor/:id", async function(req,res){
  const tempArray=req.body;
  const userId=details._id;

  console.log(userId);


  for (var i = 0; i <tempArray.product.length ; i++) {

    if(tempArray.quantity[i]>=1){
      const user = await Users.findById(userId);
        // if (!user) {
      //   return res.status(404).json({ success: false, error: 'User not found.' });
      // }
      // Initialize the cart array if it's undefined
      const product=tempArray.product[i];
      const quantity=tempArray.quantity[i];
      const price=tempArray.price[i];
      // Create a new cart item
      const newItem = { product,quantity ,price};
      console.log(newItem);

      user.cart.push(newItem);

      // Save the user
      await user.save()
      .then(updatedUser => {
        details=updatedUser;
    console.log('Item added to cart:', updatedUser);
  })
  .catch(error => {
    console.error('Error:', error);
  });


  }}
await res.redirect("/ordernow/vendor/"+req.params.id);

});

app.get("/checkout/:id",async function(req,res){
  const tempUserCart=details.cart;
  const productId = req.params.id;
  const list= await Vendors.findById(productId);

res.render("secretU/checkout.ejs",{isloggedIn:isloggedIn,tempUserCart:tempUserCart,list:list});
});

app.post("/checkout/:id",async function(req,res){

  console.log(req.body.longitude);
  console.log(req.body.latitude);
  const tempUserCart=details;
  const id = req.params.id;
  const list= await Vendors.findById(id);


  const newOrder = new Order({
  name: tempUserCart.name,
  phoneNumber:tempUserCart.phoneNumber,
  address: tempUserCart.address,
  longitude:req.body.longitude,
  latitude:req.body.latitude,
  products: []
});

// Array of products
const products = tempUserCart.cart;

// Push each product to the order's products array
for (let i = 0; i < products.length; i++) {
  const { product, quantity, price } = products[i];
  newOrder.products.push({ product, quantity, price });
}

// Save the new order
newOrder.save()
  .then(savedOrder => {
    // Add the order to the vendor's orders array
    return Vendors.findByIdAndUpdate(id, { $push: { orders: savedOrder } }, { new: true });
  })
  .then(updatedVendor => {
    console.log('Order saved and associated with the vendor:', updatedVendor);
    // Handle any further operations
  })
  .catch(error => {
    console.error('Error saving order:', error);
    // Handle the error appropriately
  });

  Users.updateOne({ _id: tempUserCart._id }, { $unset: { cart: 1 } })
  .then(() => {
    console.log('Cart field deleted successfully');
  })
  .catch((err) => {
    console.log('Error deleting cart:', err);
  });

res.redirect("/");

});





app.get("/orderlist",function(req,res){
  const tempVendorDetails=details.orders;


  for (var i = 0; i < tempVendorDetails.length; i++) {
    console.log(tempVendorDetails[i].name);
    console.log(tempVendorDetails[i].phoneNumber);
    for (var j = 0; j < tempVendorDetails[i].products.length; j++) {
      console.log(tempVendorDetails[i].products[j].product);
    }
  }




  res.render("secretV/orderlist.ejs",{isloggedIn:isloggedIn,tempVendorDetails:tempVendorDetails,details:details});
});

app.post("/clearcart/:id", async function(req,res){
  console.log("hello");
  const tempuserId=details;

  Users.updateOne({ _id: tempuserId._id }, { $unset: { cart: 1 } })
  .then(() => {
    console.log('Cart field deleted successfully');
  })
  .catch((err) => {
    console.log('Error deleting cart:', err);
  });

  const user = await Users.findOne({ _id:tempuserId._id });
    details=user;

  res.redirect("/ordernow/vendor/"+req.params.id);
});


app.post("/deletevendorcart/:id",function(req,res){
  const tempVendorId=details._id;
  const tempcartId=req.params.id;


  Vendors.updateOne(
  { _id: tempVendorId }, // Match the user by their ID
  { $pull: { cart: { _id: tempcartId } } } // Remove the item from the cart array by its ID
)
  .then(() => {
    console.log("Item deleted from cart successfully");
  })
  .catch((error) => {
    console.log("Error deleting item from cart:", error);
  });

res.redirect("/vendorstore");

});

app.post("/deleteorder/:id",async function(req,res){
  const tempVendorId=details._id;
  const tempcartId=req.params.id;

  Vendors.updateOne(
  { _id: tempVendorId }, // Match the user by their ID
  { $pull: { orders: { _id: tempcartId } } } // Remove the item from the cart array by its ID
  )
  .then(() => {
    console.log("Item deleted from Order List");
  })
  .catch((error) => {
    console.log("Error deleting item from Orders List:", error);
  });

  const latestDetails= await Vendors.findById(details._id);
  details=latestDetails;

  res.redirect("/orderlist");

});






app.get("/trackyourorder/:id",async function(req,res){
  const orderId=req.params.id;


    const vendor = await Vendors.findOne({ 'orders._id': orderId }, { 'orders.$': 1 }).exec();



    const order = vendor.orders[0];
    console.log('Order details:', order);

    // console.log(order.longitude, order.latitude);

  res.render("secretV/trackyourorder",{order:order});
});



app.listen(3000, function(err){
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port 3000");
});
