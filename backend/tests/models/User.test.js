const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User Model Test', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'employee'
  };

  it('should create & save user successfully', async () => {
    const validUser = new User(validUserData);
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(validUserData.email);
    expect(savedUser.firstName).toBe(validUserData.firstName);
    expect(savedUser.lastName).toBe(validUserData.lastName);
    expect(savedUser.role).toBe(validUserData.role);
    expect(savedUser.password).not.toBe(validUserData.password); // Password should be hashed
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ email: 'test@example.com' });
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should fail to save user with invalid email', async () => {
    const userWithInvalidEmail = new User({
      ...validUserData,
      email: 'invalid-email'
    });
    let err;
    
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should fail to save duplicate email', async () => {
    const firstUser = new User(validUserData);
    await firstUser.save();
    
    const duplicateUser = new User(validUserData);
    let err;
    
    try {
      await duplicateUser.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // MongoDB duplicate key error code
  });

  it('should correctly compare password', async () => {
    const user = new User(validUserData);
    await user.save();
    
    const isMatch = await user.comparePassword(validUserData.password);
    const isNotMatch = await user.comparePassword('wrongpassword');
    
    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });

  it('should generate correct public JSON', async () => {
    const user = new User(validUserData);
    await user.save();
    
    const publicJSON = user.toPublicJSON();
    
    expect(publicJSON.password).toBeUndefined();
    expect(publicJSON.email).toBe(validUserData.email);
    expect(publicJSON.firstName).toBe(validUserData.firstName);
    expect(publicJSON.lastName).toBe(validUserData.lastName);
    expect(publicJSON.role).toBe(validUserData.role);
  });

  it('should have default role as employee', async () => {
    const userWithoutRole = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    await userWithoutRole.save();
    expect(userWithoutRole.role).toBe('employee');
  });

  it('should have default isActive as true', async () => {
    const user = new User(validUserData);
    await user.save();
    expect(user.isActive).toBe(true);
  });
}); 