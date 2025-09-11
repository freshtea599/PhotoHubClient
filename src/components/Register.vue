<template>
  <div class="container">
    <h2>Регистрация</h2>
    <form @submit.prevent="register">
      <input class="input" type="email" v-model="email" placeholder="Введите email" required />
      <input class="input" type="password" v-model="password" placeholder="Введите пароль" required />
      <button class="btn" type="submit">Зарегистрироваться</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p>Уже есть аккаунт? <router-link to="/login" class="log">Войти</router-link></p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      email: "",
      password: "",
      errorMessage: "",
    };
  },
  methods: {
    async register() {
      try {
        if (!this.email || !this.password) {
          this.errorMessage = "Заполните все поля!";
          return;
        }

        await axios.post("http://localhost:3000/api/register", {
          email: this.email,
          password: this.password,
        });

        alert("Регистрация успешна!");
        this.$router.push("/login");
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Ошибка регистрации!";
      }
    },
  },
};
</script>

<style scoped>

.container {
 display: flex;
 flex-direction: column;
 margin: auto;
 text-align: center;
 margin-top: 100px;
 font-size: 18px;
}

form {
    display: flex;
    flex-direction: column;
    margin: auto;
}

.input {
    margin-top: 15px;
    width: 100%;
    border: 1px solid rgb(209, 200, 200);
    border-radius: 6px;
    height: 40px;
    width: 390px;
}
h2 {
  font-size: 25px;
  font-weight: 900;
}

.btn {
  width: 100%;
  border-radius: 6px;
  padding: 5px 60px;
  margin-top: 5px;
  background-color: rgb(59, 130, 246);
  color: aliceblue;
}

.log {
  font-weight: 600;
  color:blue;
}

</style>
