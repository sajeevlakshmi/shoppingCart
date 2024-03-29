var express = require('express');
var router = express.Router();


const productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')

const verifyLogin=(req,res,next)=>{
 if(req.session.userloggedIn){
   next()
 }
 else
 res.redirect('/login')

}

/* GET home page. */
router.get('/',async function(req,res,next){
  res.render('user/home');
})
router.get('/home',(req,res)=>{
  res.render('user/home');
})


router.get('/products', async function(req, res) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user)
  {           
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
   
        res.render('user/view-products',{products,user,cartCount});
   })
});
router.get('/login',(req,res)=>{
  if(req.session.userloggedIn)
  {
    res.redirect('/products')
  }else{
    let loginErr=req.session.loginErr
  res.render('user/login',{loginErr})
  req.session.loginErr=false

  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
userHelpers.doSignup(req.body).then((response)=>{
  console.log(response)
 
   req.session.user=response
   req.session.userloggedIn=true
   res.redirect('/')
})
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{

    if(response.status){
      console.log("user found")
      
      req.session.user=response.user
      req.session.userloggedIn=true

      console.log(req.session.user)
      res.redirect('/products')
    }
    else{
     req.session.loginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
let products= await userHelpers.getCartProducts(req.session.user._id)
let totalValue=0

if (products.length>0){
  totalValue=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{products,user:req.session.user,totalValue})
}
else{

}

})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
   userHelpers.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await userHelpers.getTotalAmount(req.body.user)
    console.log(response)
   res.json(response)
  })
})
router.post('/delete-cart-product',(req,res)=>{
  console.log(req.body)
  userHelpers.deleteCartProduct(req.body).then((response)=>{
    console.log(response)
  res.json(response)
  })
  
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  console.log("total",total)
  res.render('user/placeOrder',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  // console.log(req.body)
  let products=await userHelpers.getCartProductList(req.body.userId)
  console.log("products",products)
  if(products){
    let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    }
     else{
    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
      res.json(response)

    })
  }
   
  })

  }
  else{
    res.json({placeOrder:false})
  }
  
 
})
router.get('/order-placed',(req,res)=>{
  res.render('user/order-placed')
})

router.get('/orders',verifyLogin,async(req,res)=>{
 let orders=await userHelpers.getUserOrders(req.session.user._id)
 res.render('user/orders',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
let products= await userHelpers.getOrderProducts(req.params.id)
res.render('user/view-order-products',{user:req.session.user,products})
})
router.post('/verify-payment',verifyLogin,(req,res)=>{
  console.log("payment_details:",req.body)
  userHelpers.verifyPayment(req.body).then((response)=>{
    // console.log("receipt",req.body['order[response][receipt]'])
    userHelpers.changePaymentStatus(req.body['order[receipt]'],"placed").then(()=>{
      console.log("payment Successful")
      res.json({status:true})
  
    })
    }).catch((err)=>{
      console.log(err)
      res.json({status:false})
   
  })          
})
module.exports = router;
