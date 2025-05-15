import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Express, NextFunction, Request, Response } from 'express';
import { pool } from './db';
import { storage } from './storage';

// Set up session store
const pgSession = connectPgSimple(session);
const sessionStore = new pgSession({
  pool,
  tableName: 'sessions',
  createTableIfMissing: false,
});

// Configure session middleware
export const configureSession = (app: Express) => {
  app.set('trust proxy', 1);
  
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'keyboard cat', // Better to set this as an environment variable
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    })
  );
};

// Configure Passport.js
export const configurePassport = (app: Express) => {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Set up Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists in the database
          let user = await storage.getUserByGoogleId(profile.id);

          if (!user) {
            // If the user doesn't exist, create a new user
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const displayName = profile.displayName || email.split('@')[0];
            const photoUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

            user = await storage.createUser({
              username: displayName,
              email,
              googleId: profile.id,
              avatarUrl: photoUrl,
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Authentication routes
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Error logging out', err);
      }
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};