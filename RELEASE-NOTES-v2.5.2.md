# MoneyCove v2.5.2

- Fixed iPhone/PWA Add Transaction sheet drifting with page scroll or keyboard viewport changes.
- Locks background scroll while transaction editor is open and keeps scrolling inside the sheet.
- Removed forced autofocus that could immediately resize the iOS visual viewport.
- Added safe-area-aware sticky actions for iPhone home-indicator devices.
- Added cloud finance-state backups before every saved change through `moneycove_save_finance_state`.
- Hardened Reset All Finance Data: users must type `RESET` before destructive clearing can run.
- Bumped app version to 2.5.2.

Password reset redirect note: the shared Supabase project must list MoneyCove production URLs in Authentication > URL Configuration > Redirect URLs.
