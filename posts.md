---
layout: home

hero:
  name: Posts
  tagline: Today I Learned 🔥
  image:
    src: /images/logo/143_f2.png
---

<script setup>
import dayjs from 'dayjs';
import { groupBy } from 'es-toolkit';
import { data as posts } from '.vitepress/theme/posts.data.ts';

const postsByYear = groupBy(posts, item => dayjs(item.date?.time).format('YYYY'));
const years = Object.keys(postsByYear).reverse().filter(year => year !== 'Invalid Date')
</script>

<div v-for="(year, idx) in years" :key="idx">
<h1 class="text-5xl! font-extrabold! my-5!" :class="{'mt-15!': idx > 0}">{{year}}</h1>
  <ul>
    <li v-for="post in postsByYear[year]" :key="post.url">
      <a :href="post.url">{{ post.title }}</a> <small>({{ post.date?.string }})</small>
      <p>{{ post.description }}</p>
    </li>
  </ul>
</div>