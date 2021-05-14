var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('admin/view-products', { admin:true,products})
  })
});
router.get('/all-orders',(req,res)=>{
  productHelpers.getAllOrders().then((orders)=>{
    console.log(orders)
    res.render('admin/all-orders', { admin:true,orders})
  })
})
router.get('/edit-orders/',(req,res)=>{

  productHelpers.getAllOrders().then((orders)=>{
    console.log(orders)
    res.render('admin/edit-orders', { admin:true,orders})
  })
})
router.post('/edit-orders',(req,res)=>{
  console.log(req.body);
  userHelpers.changePaymentStatus(req.body.order,req.body.status).then(()=>{
    console.log("status updated")
    res.json({status:true})

  })

})
router.get('/view-order-products/:id',async(req,res)=>{
  let products= await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products',{admin:true,products})
  })


router.get('/add-products',function(req,res){
  res.render('admin/add-products')
})

 router.post('/add-products',(req,res)=>{
   console.log(req.body)
   productHelpers.addproduct(req.body,(id)=>{
     let image=req.files.image
     image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
       if(!err){
        res.render('admin/add-products')
       }
       else{
         console.log(err)
       }

     })
     
   })

 })
 router.get('/delete-products/:id',(req,res)=>{
let proId=req.params.id;

productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/')
})

 })
 router.get('/edit-products/:id',async(req,res)=>{
   let product=await productHelpers.getProductDetails(req.params.id)
   
   res.render('admin/edit-products',{product})
 })
router.post('/edit-products/:id',async(req,res)=>{
  console.log(req.params.id)
   await productHelpers.updateProduct(req.params.id,req.body).then((response)=>{
     let id=req.params.id
    console.log(response)
    
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
      
    }
    res.redirect('/admin/')
  })
})
module.exports = router;
