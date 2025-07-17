'use client'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

function Profile() {

  const router = useRouter()
  const [data, setData] = useState("nothing")

  const getUserDetails = async () => {
    try {
      const res = await axios.post("api/users/me")
      console.log(res.data);
      setData(res.data.data._id)
    } catch (error : any) {
      console.log(error.message);
      toast.error(error.message);
    }
  }

  const logout = async () =>{
    try {
      axios.get("api/users/logout")
      setData("nothing")
      router.push("/login")
    } catch (error: any) {
      console.log(error.message);
      toast.error(error.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Your Profile</h1>
        <p className="text-gray-500 mb-6">Manage your session and explore your details</p>

        <hr className="my-4" />

        <div className="mb-6">
          {data === 'nothing' ? (
            <p className="text-red-500 font-medium">No Data to Display</p>
          ) : (
            <Link
              href={`/profile/${data}`}
              className="text-blue-600 font-medium hover:underline"
            >
              Go to Profile: <span className="font-semibold">{data}</span>
            </Link>
          )}
        </div>
        <div>
          <p className="text-gray-600 mb-4">You can also:</p>
          <Link href="/createPost" className="text-blue-600 font-medium hover:underline">
            create a post
          </Link>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={logout}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Logout
          </button>

          <button
            onClick={getUserDetails}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
          >
            Get User Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile