package config

import (
	"log"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	// Mode определяет в каком режиме должно работать приложение: dev / prod / test
	Mode string `mapstructure:"mode" validate:"required,oneof=prod dev test"`
	LogsPath         string `mapstructure:"logs_path"`
	HTTPServer       `mapstructure:"http_server" validate:"required"`
}

type HTTPServer struct {
	Port         string        `mapstructure:"port" validate:"required"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
}

// Конфигурирует приложение. Поддерживает конфигурацию с помощью yaml, json и env.
// В случае неудачи во время конфигурирования вызывает панику.
func MustLoadConfig() *Config {
	viper.SetDefault("mode", "prod")
	viper.SetDefault("logs_path", "./logs/proxy_server.log")
	viper.SetDefault("http_server.port", "8011")
	viper.SetDefault("http_server.read_timeout", 30*time.Second)
	viper.SetDefault("http_server.write_timeout", 30*time.Second)

	viper.SetConfigName("config")
	viper.AddConfigPath(".")

	mustLoadEnv()
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.SetEnvPrefix("PLACE_PICKER")
	mustLoadSecretKey()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok && !viper.InConfig("mode") {
			log.Panic("Config file not found and no env vars provided")
		}
		log.Panicf("Error reading config: %v", err)
	}

	var config Config
	err := viper.Unmarshal(&config)
	if err != nil {
		log.Panicf("MustLoadConfig: unable to decode into struct, %v", err)
	}

	validate := validator.New(validator.WithRequiredStructEnabled())
	if err := validate.Struct(config); err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			log.Printf("MustLoadConfig: config error. Field %s: %s", err.Field(), err.Tag())
		}
		log.Panic("MustLoadConfig: config validation failed")
	}

	return &config
}

func mustLoadEnv() {
	err := godotenv.Load()

	if err != nil {
		log.Panic("mustLoadEnv | Error loading .env file")
	}
}

func IsProdMode() bool {
	return viper.GetString("mode") == "prod"
}

func mustLoadSecretKey() {
	key := viper.GetString("jwt.secret")
	trimmed := strings.TrimSpace(key)

	if len(trimmed) == 0 {
		log.Panic("mustLoadSecretKey | The length of the JWT key must be greater than 0")
	}
}