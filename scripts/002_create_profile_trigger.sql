-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
  username_suffix int := 0;
  final_username text;
begin
  -- Generate base username from email or metadata
  new_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );
  
  final_username := new_username;
  
  -- Add loop to ensure unique username generation
  -- Keep trying with incrementing suffix until we find a unique username
  loop
    begin
      -- Try to insert profile
      insert into public.profiles (id, username, full_name, avatar_url)
      values (
        new.id,
        final_username,
        coalesce(new.raw_user_meta_data ->> 'full_name', null),
        coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
      );
      
      -- If successful, exit the loop
      exit;
    exception
      when unique_violation then
        -- Username already exists, try with suffix
        username_suffix := username_suffix + 1;
        final_username := new_username || '_' || username_suffix;
    end;
  end loop;

  -- Create wallet for new user with error handling
  begin
    insert into public.wallets (user_id, balance_cents)
    values (new.id, 0)
    on conflict (user_id) do nothing;
  exception
    when others then
      raise warning 'Error creating wallet for user %: %', new.id, sqlerrm;
  end;

  return new;
exception
  when others then
    -- Log detailed error but don't fail the signup
    raise warning 'Error in handle_new_user for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Recreate the trigger to ensure it's properly set up
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Grant necessary permissions to the trigger function
-- This ensures the function can bypass RLS policies
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
