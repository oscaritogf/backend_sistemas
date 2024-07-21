const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../../config/cloudinary');
const { sendEmployeeWelcomeEmail } = require('../../utils/emailService');

