import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-gray-50 p-12 text-center">
        <div className="flex items-center gap-3 mb-6">
          <img
            src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/wjyXx6yIud/2zk5n7fp_expires_30_days.png"}
            className="w-12 h-12 object-fill"
            alt="Zalo.Care logo"
          />
          <span className="text-black text-3xl font-bold">
            Zalo.Care
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Giải pháp CSKH Zalo tự động
        </h1>
        <p className="text-gray-600 max-w-md">
          Ứng dụng AI để chăm sóc khách hàng cũ toàn diện, giúp bạn không "BỎ QUÊN" bất kì khách hàng tiềm năng nào.
        </p>
        <Sparkles className="w-16 h-16 text-orange-500 mt-8" />
      </div>
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(35, 91%, 55%)',
                    brandAccent: 'hsl(35, 91%, 65%)',
                  },
                },
              },
            }}
            providers={[]}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Địa chỉ email',
                  password_label: 'Mật khẩu',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  password_input_placeholder: 'Mật khẩu của bạn',
                  button_label: 'Đăng nhập',
                  social_provider_text: 'Đăng nhập với {{provider}}',
                  link_text: 'Đã có tài khoản? Đăng nhập',
                },
                sign_up: {
                  email_label: 'Địa chỉ email',
                  password_label: 'Mật khẩu',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  password_input_placeholder: 'Mật khẩu của bạn',
                  button_label: 'Đăng ký',
                  social_provider_text: 'Đăng ký với {{provider}}',
                  link_text: 'Chưa có tài khoản? Đăng ký',
                },
                forgotten_password: {
                  email_label: 'Địa chỉ email',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  button_label: 'Gửi hướng dẫn',
                  link_text: 'Quên mật khẩu?',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;