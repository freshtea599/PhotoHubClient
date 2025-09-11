<template>
  <div class="flex flex-col items-center mt-10">
    <h2 class="text-2xl font-bold mb-4">Загрузить Фото</h2>
    <input type="file" @change="handleFileUpload" class="mb-4" />
    <button
      @click="uploadPhoto"
      :disabled="!photo"
      class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
    >
      Загрузить
    </button>
    <p v-if="message" class="mt-4 text-green-500">{{ message }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      photo: null,
      message: "",
    };
  },
  methods: {
    handleFileUpload(event) {
      this.photo = event.target.files[0];
    },
    async uploadPhoto() {
      if (!this.photo) return;

      const formData = new FormData();
      formData.append("photo", this.photo);

      try {
        const response = await fetch("http://localhost:3000/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Ошибка загрузки");

        const data = await response.json();
        this.message = `Фото успешно загружено: ${data.imageUrl}`;
      } catch (err) {
        this.message = "Произошла ошибка. Попробуйте снова.";
        console.error(err);
      }
    },
  },
};
</script>
