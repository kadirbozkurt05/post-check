/*
  # Add set_claim function for user claims

  1. New Functions
    - `set_claim`: Sets user claims for room_number and initials
      - Parameters:
        - room_number (text): The room number to set
        - initials (text): The initials to set
      - Returns: void
      - Sets app.room_number and app.initials claims for the current session

  2. Security
    - Function is accessible to public users
    - Claims are set for the current session only
*/

create or replace function public.set_claim(room_number text, initials text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.room_number', room_number, true);
  perform set_config('app.initials', initials, true);
end;
$$;