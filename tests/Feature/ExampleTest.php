<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // The SPA shell is supplied by the frontend build; verify a backend
        // route here so backend-only test runs do not require that view.
        $response = $this->get('/robots.txt');

        $response->assertStatus(200);
    }
}
