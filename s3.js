require('dotenv').config()
const S3 = require('aws-sdk/clients/s3')


const bucketname = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

function uploadFile(file){
    // const filestream = fs.createReadStream(file.path)
    const fname = file+Date.now();
    console.log('filename'+fname)
    const uploadParams = {
        Bucket: bucketname,
        Body: file,
        Key: fname
    }
    return s3.upload(uploadParams).promise()

}
exports.uploadFile = uploadFile