import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import crypto from 'crypto';
import { User, UserRole } from '../models';
import { logger, logAudit } from '../utils/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export const configurePassport = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth credentials not configured. Google Sign-In will be disabled.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/v1/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const picture = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error('Email not provided by Google'), undefined);
          }

          // Check if user exists with this email
          let user = await User.findOne({ where: { email } });

          if (user) {
            // User exists - update Google ID if not set
            if (!user.googleId) {
              user.googleId = googleId;
              if (picture && !user.avatarUrl) {
                user.avatarUrl = picture;
              }
              await user.save();
            }

            // Check if account is active
            if (!user.isActive) {
              return done(new Error('Account is disabled'), undefined);
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            logAudit('USER_GOOGLE_LOGIN', user.id, { email });
          } else {
            // Create new user
            const username = email.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
            const displayName = firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0];

            user = await User.create({
              email,
              username,
              googleId,
              displayName,
              firstName,
              lastName,
              avatarUrl: picture,
              role: UserRole.CREATOR,
              emailVerified: true, // Google already verified the email
              passwordHash: crypto.randomBytes(32).toString('hex') // Random password since they use Google
            });

            logAudit('USER_GOOGLE_REGISTER', user.id, { email });
          }

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user for session (we don't use sessions, but passport requires this)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  logger.info('Passport Google OAuth2 strategy configured');
};

export default passport;
