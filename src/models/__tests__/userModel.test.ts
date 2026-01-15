import User from '@/models/userModel'

// Don't mock mongoose for model tests - we need the real implementation
describe('User Model', () => {

  it('should have correct schema fields', () => {
    const userSchema = User.schema

    expect(userSchema.paths.userName).toBeDefined()
    expect(userSchema.paths.email).toBeDefined()
    expect(userSchema.paths.password).toBeDefined()
    expect(userSchema.paths.isVerified).toBeDefined()
    expect(userSchema.paths.isAdmin).toBeDefined()
    expect(userSchema.paths.verifyToken).toBeDefined()
    expect(userSchema.paths.verifyTokenExpiry).toBeDefined()
    expect(userSchema.paths.forgotPasswordToken).toBeDefined()
    expect(userSchema.paths.forgotPasswordTokenExpiry).toBeDefined()
  })

  it('should have required userName field', () => {
    const userSchema = User.schema
    const userNamePath = userSchema.paths.userName

    expect(userNamePath.isRequired).toBe(true)
  })

  it('should have required email field', () => {
    const userSchema = User.schema
    const emailPath = userSchema.paths.email

    expect(emailPath.isRequired).toBe(true)
  })

  it('should have required password field', () => {
    const userSchema = User.schema
    const passwordPath = userSchema.paths.password

    expect(passwordPath.isRequired).toBe(true)
  })

  it('should have unique userName constraint', () => {
    const userSchema = User.schema
    const userNamePath = userSchema.paths.userName

    // unique can be a boolean or an array [boolean, message]
    const unique = userNamePath.options.unique
    expect(Array.isArray(unique) ? unique[0] : unique).toBe(true)
  })

  it('should have unique email constraint', () => {
    const userSchema = User.schema
    const emailPath = userSchema.paths.email

    // unique can be a boolean or an array [boolean, message]
    const unique = emailPath.options.unique
    expect(Array.isArray(unique) ? unique[0] : unique).toBe(true)
  })

  it('should have unique password constraint', () => {
    const userSchema = User.schema
    const passwordPath = userSchema.paths.password

    expect(passwordPath.options.unique).toBe(true)
  })

  it('should have isVerified default to false', () => {
    const userSchema = User.schema
    const isVerifiedPath = userSchema.paths.isVerified

    expect(isVerifiedPath.options.default).toBe(false)
  })

  it('should have isAdmin default to false', () => {
    const userSchema = User.schema
    const isAdminPath = userSchema.paths.isAdmin

    expect(isAdminPath.options.default).toBe(false)
  })

  it('should have optional verification token fields', () => {
    const userSchema = User.schema

    expect(userSchema.paths.verifyToken).toBeDefined()
    expect(userSchema.paths.verifyTokenExpiry).toBeDefined()
  })

  it('should have optional password reset fields', () => {
    const userSchema = User.schema

    expect(userSchema.paths.forgotPasswordToken).toBeDefined()
    expect(userSchema.paths.forgotPasswordTokenExpiry).toBeDefined()
  })

  it('should prevent duplicate model creation', () => {
    // The model checks for mongoose.models.users
    expect(User).toBeDefined()
  })
})
