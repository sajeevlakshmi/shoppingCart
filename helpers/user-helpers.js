var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectID
const { ObjectID } = require('bson')
const { response } = require('express')
var Razorpay=require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_9coaZKRhVqP3Eo',
    key_secret: 'rD4bJv1KMIB5xq41gHKF6YMR',
  })
  

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password= await bcrypt.hash(userData.password,10)

            
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
            
        })



    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
          let user= await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
             
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("success")
                        response.user=user
                        response.status=true
                        resolve(response)
                        
                    }
                    else{
                        console.log("login failed")
                        resolve({status:false})
                    }
                })
            }
            else{
                console.log("login failed")
                resolve({status:false})
            }     
                           
    
        })
    },
addToCart:(prodId,userId)=>{
    let proObj={
        item:objectId(prodId),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart)
        { 
            let proExist=userCart.products.findIndex(products=>products.item==prodId)
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(prodId)},
                {
                    $inc:{'products.$.quantity':1}
                }                          
                ).then(()=>{
                    resolve()
                })

            }else {
            
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},{
                
                    $push:{products:proObj}
                
            }).then((response)=>{
                resolve()
            })
        }

        }
        else{
            let cartObj={
                user:objectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()

            })
        }

    })
},
getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
   let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
       {
           $match:{user:objectId(userId)}
        },
        {
            $unwind:'$products'
        },
        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }

        },
        {
           $lookup:{
               from:collection.PRODUCT_COLLECTION,
               localField:'item',
               foreignField:'_id',
               as:'product'        }
        },
        {
            $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
        }
        
       
   ]).toArray()
   resolve(cartItems)
    })
},
getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartCount=0;
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
            cartCount=cart.products.length
        }
        resolve(cartCount)

    })
},
changeProductQuantity:(details)=>{
    console.log(details)
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise(async(resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                console.log(response)
                 resolve({removeProduct:true})
                
            }) 
        }
        else 
        {
       await db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }
                ).then((response)=>{
                    resolve({status:true})
                })
            }       
    })
},

deleteCartProduct:(prodDetails)=>{
console.log(prodDetails)
return new Promise((resolve,reject)=>{
    db.get().collection(collection.CART_COLLECTION)
    .updateOne({_id:objectId(prodDetails.cart)},
    {
        $pull:{products:{item:objectId(prodDetails.product)}}
    }
    ).then((response)=>{
        console.log(response)
         resolve({removeProduct:true})
        
    })
    
})
},
getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
             },
             {
                 $unwind:'$products'
             },
             {
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 }
     
             },
             {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'        }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             },
             {
                $project:{
                    item:1,quantity:1,price:{$toInt:'$product.Price'}
                }
            },
             {
                 $group:{
                     _id:null,
                     total:{$sum:{'$multiply':['$quantity','$price']}}
                 }
             }
             
            
        ]).toArray()
       
        console.log(total[0].total)
        resolve(total[0].total)
         })

},
placeOrder:(order,products,total)=>{
return new Promise((resolve,reject)=>{
console.log(order,products,total);
let status= order['payment-method'] ==='COD'?'placed':'pending';

let orderObj={
    deliveryAddress:{
        address:order.address,
        mobile:order.mobile,
        pincode:order.pincode
    },
    userId:objectId(order.userId),
    paymentMethod:order['payment-method'] ,
    totalAmount:total,
    products:products,
    status:status,
    date:new Date().toDateString()
}
db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
    db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
    resolve(response.ops[0]._id)
})
})
},
getCartProductList:(userId)=>{
return new Promise(async(resolve,reject)=>{
    let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
    console.log("cart products",cart)
  resolve(cart.products)
})
},
getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let order= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
        console.log(order)
        resolve(order)
    })
},
getOrderProducts:(orderId)=>{
    console.log(orderId)
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:objectId(orderId)}
             },
             {
                 $unwind:'$products'
             },
             {
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 }
     
             },
             {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'        }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             }
             
            
        ]).toArray()
        console.log("orderItems:",orderItems)
        resolve(orderItems)
         })
},
generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var options = {
            amount: total * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: ""+orderId
          };
          instance.orders.create(options, function(err, order) {
            console.log("new order:",order);
            resolve(order)
          });

    })

},
verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'rD4bJv1KMIB5xq41gHKF6YMR');
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
      hmac=hmac.digest('hex');
      if (hmac==details['payment[razorpay_signature]']){
        resolve()
      }
        else {
          reject()
        }

      
    })
  },
  changePaymentStatus:(orderId,order_status)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectID(orderId)},
      {
        $set:{
          status:order_status
        }
      }).then(()=>{
        resolve()

      })
      
      
    })

  }


}