import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(buffer: Buffer, mimetype: string) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'property-agent/rooms', resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve({ secure_url: result.secure_url, public_id: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId)
}
