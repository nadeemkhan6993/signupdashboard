'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {toast} from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SignUp = () => {

  const router = useRouter()

  const [user, setUser] = useState({
    email: "",
    password :"",
    userName: ""
  })
  const [buttonDisabled, setButtonDisabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const onSignUp = async () =>{
    try {
      setLoading(true)
      const response = await axios.post("/api/users/signup", user)
      console.log(response.data)
      console.log("Signup Success")
      router.push("/login")
    } catch (error: any) {
      console.log("Signup failed..!!!")
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if(user.email.length > 0 && user.password.length > 0 && user.userName.length > 0){
      setButtonDisabled(false)
    }else{
      setButtonDisabled(true)
    }
  }, [user])

  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-2'>
      <h1>{loading ? "Processing..............!!!!" : "Signup"} </h1>
      <hr />
      <label htmlFor="username">username</label>
      <input 
        type="text"
        className='p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus-border-gray-600 text-black'
        placeholder='username' 
        value={user.userName} 
        id="username" 
        onChange={(e)=> setUser({...user, userName: e.target.value})} />
        <hr />
        <label htmlFor="email">email</label>
      <input 
        type="email"
        className='p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus-border-gray-600 text-black'
        placeholder='email' 
        value={user.email} 
        id="email" 
        onChange={(e)=> setUser({...user, email: e.target.value})} />
      <hr />
      <label htmlFor="password">password</label>
      <input 
        type="password"
        className='p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus-border-gray-600 text-black'
        placeholder='password' 
        value={user.password} 
        id="password" 
        onChange={(e)=> setUser({...user, password: e.target.value})} />
      <hr />
      <button className='p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus-border-gray-600'
        onClick={onSignUp}
        >
        {buttonDisabled ? "Fill the Form" : "Signup"}
      </button>
      <Link href="/login">Go to Login</Link>
    </div>
  )
}

export default SignUp