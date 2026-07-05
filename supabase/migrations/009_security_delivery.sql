-- Teslimat tarihi kolonu
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Kullanıcı kendi rolünü / B2B onayını değiştiremesin (admin API service_role ile değiştirebilir)
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    NEW.role := OLD.role;
    NEW.vat_verified := OLD.vat_verified;
    NEW.vat_id := OLD.vat_id;
    NEW.company_name := OLD.company_name;
    NEW.company_address := OLD.company_address;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_protect_privileged ON profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_fields();
