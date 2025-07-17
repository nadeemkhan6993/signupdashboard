'use client'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

function Login() {

  const router = useRouter()

  const [user, setUser] = useState({
    email: "",
    password :""
  })
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const onSignUp = async () =>{
    try {
      setLoading(true)
      const response = await axios.post("/api/users/login", user)
      console.log(response.data)
      console.log("Login Success")
      router.push("/profile")
    } catch (error: any) {
      console.log("Signup failed..!!!")
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if(user.email.length > 0 && user.password.length > 0){
      setButtonDisabled(false)
    }else{
      setButtonDisabled(true)
    }
  }, [user])


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {loading ? "Processing..." : "Login"}
        </h1>

        <div className="mb-4 text-left">
          <label htmlFor="email" className="block text-gray-600 mb-1 font-medium">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>

        <div className="mb-6 text-left">
          <label htmlFor="password" className="block text-gray-600 mb-1 font-medium">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
        </div>

        <button
          onClick={onSignUp}
          className={`w-full py-2 rounded-lg font-semibold transition 
            ${buttonDisabled ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          disabled={buttonDisabled}
        >
          {buttonDisabled ? "Fill the Form" : "Login"}
        </button>

        <p className="mt-6 text-gray-500 text-sm">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-blue-500 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login