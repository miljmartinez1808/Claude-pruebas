-- ============================================================
-- Datos de demo para pruebas
-- IMPORTANTE: Primero crea el usuario admin en Authentication
-- luego reemplaza el USER_ID y ejecuta este script
-- ============================================================

-- 1. Crear restaurante de demo
insert into restaurants (
  slug, name, description, address, whatsapp_number,
  hours_open, hours_close, is_open, primary_color,
  payment_methods
) values (
  'demo-burger',
  'Demo Burger',
  'Las mejores hamburguesas de la ciudad',
  'Calle 10 # 5A - 20',
  '3001234567',
  '11:00', '23:00',
  true,
  '#FBBF24',
  array['efectivo', 'transferencia']
) returning id;

-- 2. Después de obtener el restaurant_id, crear las categorías:
-- (Reemplaza RESTAURANT_ID con el UUID del paso anterior)

/*
insert into categories (restaurant_id, name, "order") values
  ('RESTAURANT_ID', 'Hamburguesas', 1),
  ('RESTAURANT_ID', 'Salchipapas', 2),
  ('RESTAURANT_ID', 'Bebidas', 3),
  ('RESTAURANT_ID', 'Postres', 4);
*/
