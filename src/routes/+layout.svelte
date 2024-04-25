<!-- src/routes/+layout.svelte -->
<script>
    import { goto } from '$app/navigation';
    import logo from '$lib/assets/goat-icon.svg'

    function navigate(path) {
        goto(path);
    }
</script>

<nav class="navbar">
    <div class="logo">
        <img src={logo} alt="Logo" style="cursor: pointer;">
    </div>
    <div class="menu">
        <button on:click={() => navigate('/signup')}>Sign Up</button>
        <button on:click={() => navigate('/')}>Log In</button>
        <button on:click={() => navigate('/about')}>About</button>
        <button on:click={() => navigate('/contact')}>Contact</button>
    </div>
</nav>

<style>
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f4f4f4;
        padding: 1em;
        box-shadow: 0 0.125em 0.25em rgba(0,0,0,0.1);
    }
    .logo img {
        height: 3em; /* Logo height */
    }
    .menu button {
        background: none;
        border: none;
        padding: 0.5em 1em;
        margin-left: 1em;
        cursor: pointer;
        font-size: 1em; /* Adjust font-size here for scaling */
    }
    .menu button:hover {
        background-color: #ddd;
    }
</style>

<slot></slot>
