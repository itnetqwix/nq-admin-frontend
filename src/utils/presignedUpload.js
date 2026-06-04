/** PUT file bytes to a presigned S3 URL. */
export async function putPresigned(url, body, contentType) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body
  })
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
}
