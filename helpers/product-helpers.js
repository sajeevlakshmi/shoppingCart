var db=require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectID
module.exports={

    addproduct:(product,callback)=>{

        db.get().collection('products').insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })
     
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
        let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
          resolve(products)  
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
             resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })

        })
    },
    updateProduct:(prodId,proDetails)=>{
        return new Promise((resolve,reject)=>{
             db.get().collection(collection.PRODUCT_COLLECTION)
             .updateOne({_id:objectId(prodId)},{
                $set:{
                    name:proDetails.name,
                    category:proDetails.category,
                    Price:proDetails.Price,
                    description:proDetails.description
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
        let allOrders= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
          resolve(allOrders)  
        })
    }
}