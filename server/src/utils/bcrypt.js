import bcrypt from "bcrypt"

const saltRounds=10;
export const generateHash=async (password)=>{

    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

export const checkHash= async (PlainPassword,hashPassword)=>{
   const check= await bcrypt.compare(PlainPassword, hashPassword);

   return check
}